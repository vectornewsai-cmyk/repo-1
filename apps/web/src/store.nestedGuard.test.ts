/**
 * store.nestedGuard.test.ts — Test qua store thật, Phase 9 đợt 18
 * (luồng nested guard): áp guard nguồn của cha (đợt 17 N3) cho
 * updateNestedInnerClip tầng 1 (R5).
 *
 * VÌ SAO FILE NÀY KHÔNG CHẠY BẰNG `node` TRỰC TIẾP: như
 * nestedStore.store.test.ts đợt 16 — store.ts dùng import không đuôi mở
 * rộng mà chỉ Vite mới phân giải. Chạy bằng esbuild bundle trước rồi chạy:
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.nestedGuard.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.nestedGuard.test.cjs --log-level=warning
 *   node /tmp/store.nestedGuard.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4: validate.js dùng dynamic require.)
 *
 * NGỮ NGHĨA GUARD (copy đúng hàm deep đợt 17 N3, chỉ khác tầng cha là
 * nested ngoài cùng vì R5 sửa clip con trực tiếp):
 * - Cha ghi trim tường minh: chỉ cấm nguồn mới co dưới trim.out.
 * - Cha không ghi trim (= "phát toàn bộ"): nguồn đổi theo hướng nào
 *   cũng lệch duration cha nên đều bị từ chối.
 * Độ dài nguồn = clip kết thúc muộn nhất trên MỌI track của subSpec cha.
 *
 * NỘI DUNG (mỗi case cài lại spec mới qua useStore.setState):
 *  G1 (ĐỢT 19 G2 — ĐỔI HÀNH VI CÓ CHỦ ĐÍCH). Cha trim [0,4), lá duy nhất
 *      [0,4) thu ngắn còn 2 → cả hàm thuần R5 lẫn store đều chặn, spec
 *      không đổi. Trước đợt 19, hàm thuần vẫn cho qua (guard chỉ ở tầng
 *      store) — case này chính là bằng chứng bypass cũ nay đã bịt.
 *  G2. Cha trim [0,4), lá [0,4) thu ngắn còn 2 nhưng track khác vẫn kết
 *      thúc ở 4 → ok:true, lá còn 2, validate rỗng.
 *  G3. Cha KHÔNG trim, lá duy nhất [0,4) thu ngắn còn 2 → ok:false,
 *      spec không đổi.
 *  G4. Cha KHÔNG trim, 2 lá [0,2) + [2,4): lá sau thu ngắn còn 1 (end 3)
 *      → ok:false (nguồn 4 → 3, lệch duration cha).
 *  G5. Cha KHÔNG trim, 2 track (lá [0,2) + lá [0,4)): dời lá ngắn từ 0
 *      lên 1 (end 3, max vẫn 4) → ok:true.
 *  G6. Cha trim [0,4): patch chỉ đổi text của lá chữ → ok:true, text
 *      đổi, duration không đổi.
 *  G7. Cha KHÔNG trim: patch chỉ đổi text của lá chữ → ok:true.
 *  G8. Cha trim [0,4), 2 lá [0,2) + [2,4): thu ngắn lá đầu còn 1 (max
 *      vẫn 4 nhờ lá sau) → ok:true, validate rỗng (ghi hợp lệ vẫn qua).
 *  G9. Lệnh bị chặn không sinh entry undo: sửa hợp lệ (c1 2→1) rồi sửa
 *      bị chặn (c2 2→1), undo 1 lần phải quay về c1=2 (không phải dừng
 *      ở entry no-op của lệnh bị chặn).
 */

import { useStore } from "./store";
import { updateNestedInnerClip as updateNestedInnerClipPure } from "./components/nested/nestUtils";
import {
  validateNestedClip,
  type Clip,
  type NestedClip,
  type VideoSpec,
} from "@repo-1/video-spec";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

type AnyClip = Record<string, unknown> & {
  id: string;
  start: number;
  duration: number;
};

function subSpec(tracks: { id: string; kind: string; clips: AnyClip[] }[]): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 64, height: 64, fps: 30 },
    tracks: tracks.map((t) => ({
      id: t.id,
      kind: t.kind,
      clips: t.clips as unknown as Clip[],
    })),
  } as unknown as VideoSpec;
}

function videoLeaf(id: string, start: number, duration: number): AnyClip {
  return {
    kind: "video", id, src: "src.mp4", start, duration, in: 0, out: duration,
  };
}

function textLeaf(id: string, start: number, duration: number, text: string): AnyClip {
  return { kind: "text", id, start, duration, text };
}

function nestedTop(
  id: string,
  inner: VideoSpec,
  duration: number,
  trim?: { in: number; out: number },
): AnyClip {
  return {
    kind: "nested", id, start: 0, duration, speed: 1,
    ...(trim !== undefined ? { trim } : {}),
    subSpec: inner,
  };
}

/** Cài spec mới toanh vào store (mỗi case gọi lại để độc lập). */
function install(top: AnyClip): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "nested guard test", width: 64, height: 64, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [top] }],
  };
  useStore.setState({
    spec: spec as never,
    selection: [],
    playhead: 0,
    rippleMode: false,
  });
}

function topNow(): NestedClip {
  const track = useStore.getState().spec.tracks.find((t) => t.id === "v1");
  if (!track) throw new Error("mất track v1");
  const top = track.clips.find((c) => c.id === "n1");
  if (!top || top.kind !== "nested") throw new Error("mất nested n1");
  return top as unknown as NestedClip;
}

function innerNow(top: NestedClip, trackId: string, clipId: string): AnyClip {
  const track = top.subSpec.tracks.find((t) => t.id === trackId);
  if (!track) throw new Error(`mất track con ${trackId}`);
  const clip = track.clips.find((c) => c.id === clipId);
  if (!clip) throw new Error(`mất clip con ${clipId}`);
  return clip as unknown as AnyClip;
}

function assertValid(top: NestedClip, what: string): void {
  const errs = validateNestedClip(top);
  if (errs.length > 0) throw new Error(`${what}: validateNestedClip: ${errs.join("; ")}`);
}

// ===========================================================================
// G1. Cha có trim, lá duy nhất thu ngắn → chặn
// ===========================================================================
console.log("== G1. cha trim + lá duy nhất thu ngắn ==");

test("G1 (đợt 19 G2 — guard đã dời xuống hàm thuần): trim [0,4), lá duy nhất 4→2 → cả thuần lẫn store đều chặn, spec không đổi", () => {
  const top = nestedTop(
    "n1",
    subSpec([{ id: "it1", kind: "video", clips: [videoLeaf("c1", 0, 4)] }]),
    4,
    { in: 0, out: 4 },
  );
  install(top);
  const before = JSON.stringify(topNow());
  // Hàm thuần R5 nay CÓ guard (đợt 19 G2 dời từ store xuống): bypass cũ
  // nay bị chặn ngay tại đây, không cần qua store.
  const pure = updateNestedInnerClipPure(
    useStore.getState().spec as unknown as VideoSpec,
    "v1", "n1", "it1", "c1", { duration: 2 },
  );
  assert("error" in pure, "hàm thuần R5 phải chặn (guard đã dời xuống)");
  if ("error" in pure) assert(pure.error.includes("trim.out"), `error phải nói rõ trim.out, nhận: ${pure.error}`);
  eq(JSON.stringify(topNow()), before, "spec không đổi sau khi thuần chặn");
  // Store action vẫn chặn như cũ (guard store giữ nguyên, cùng vị ngữ).
  const res = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "c1", { duration: 2 });
  eq(res.ok, false, "store phải chặn");
  eq(JSON.stringify(topNow()), before, "spec không đổi sau khi chặn");
});

// ===========================================================================
// G2. Cha có trim, track khác giữ nguồn → cho qua
// ===========================================================================
console.log("== G2. cha trim + track khác giữ nguồn ==");

test("G2: trim [0,4), lá 4→2 nhưng track khác vẫn end 4 → ok:true", () => {
  install(nestedTop(
    "n1",
    subSpec([
      { id: "it1", kind: "video", clips: [videoLeaf("c1", 0, 4)] },
      { id: "it2", kind: "audio", clips: [{ kind: "audio", id: "a1", src: "a.mp3", start: 0, duration: 4, in: 0, out: 4 }] },
    ]),
    4,
    { in: 0, out: 4 },
  ));
  const res = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "c1", { duration: 2 });
  eq(res.ok, true, "phải cho qua vì nguồn mới vẫn 4 >= trim.out 4");
  const top = topNow();
  eq(innerNow(top, "it1", "c1").duration, 2, "lá còn 2");
  eq(innerNow(top, "it2", "a1").duration, 4, "track khác không đổi");
  assertValid(top, "G2");
});

// ===========================================================================
// G3 + G4. Cha không trim → mọi đổi nguồn đều chặn
// ===========================================================================
console.log("== G3/G4. cha không trim ==");

test("G3: không trim, lá duy nhất 4→2 → ok:false, spec không đổi", () => {
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", kind: "video", clips: [videoLeaf("c1", 0, 4)] }]),
    4,
  ));
  const before = JSON.stringify(topNow());
  const res = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "c1", { duration: 2 });
  eq(res.ok, false, "không trim: nguồn đổi hướng nào cũng chặn");
  eq(JSON.stringify(topNow()), before, "spec không đổi");
});

test("G4: không trim, lá sau [2,4) thu còn 1 (end 3) → ok:false", () => {
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", kind: "video", clips: [videoLeaf("c1", 0, 2), videoLeaf("c2", 2, 2)] }]),
    4,
  ));
  const before = JSON.stringify(topNow());
  const res = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "c2", { duration: 1 });
  eq(res.ok, false, "nguồn 4→3 lệch duration cha nên chặn");
  eq(JSON.stringify(topNow()), before, "spec không đổi");
});

// ===========================================================================
// G5. Cha không trim, dời giữ max → cho qua
// ===========================================================================
console.log("== G5. cha không trim, dời giữ max ==");

test("G5: không trim, dời lá ngắn 0→1 (end 3, max vẫn 4) → ok:true", () => {
  install(nestedTop(
    "n1",
    subSpec([
      { id: "it1", kind: "video", clips: [videoLeaf("c1", 0, 2)] },
      { id: "it2", kind: "audio", clips: [{ kind: "audio", id: "a1", src: "a.mp3", start: 0, duration: 4, in: 0, out: 4 }] },
    ]),
    4,
  ));
  const res = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "c1", { start: 1 });
  eq(res.ok, true, "max nguồn không đổi nên cho qua");
  eq(innerNow(topNow(), "it1", "c1").start, 1, "lá đã dời");
  assertValid(topNow(), "G5");
});

// ===========================================================================
// G6 + G7. Patch chỉ đổi text → luôn qua (nguồn không đổi)
// ===========================================================================
console.log("== G6/G7. patch text-only ==");

test("G6: cha trim [0,4), patch text-only → ok:true, text đổi, duration giữ nguyên", () => {
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", kind: "video", clips: [textLeaf("t1", 0, 4, "Xin chào")] }]),
    4,
    { in: 0, out: 4 },
  ));
  const res = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "t1", { text: "Tạm biệt" });
  eq(res.ok, true, "text-only phải qua");
  eq(innerNow(topNow(), "it1", "t1").text, "Tạm biệt", "text đã đổi");
  eq(innerNow(topNow(), "it1", "t1").duration, 4, "duration giữ nguyên");
});

test("G7: cha không trim, patch text-only → ok:true", () => {
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", kind: "video", clips: [textLeaf("t1", 0, 4, "Xin chào")] }]),
    4,
  ));
  const res = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "t1", { text: "Tạm biệt" });
  eq(res.ok, true, "text-only phải qua kể cả khi cha không trim");
  eq(innerNow(topNow(), "it1", "t1").text, "Tạm biệt", "text đã đổi");
});

// ===========================================================================
// G8. Ghi hình học hợp lệ vẫn qua (cha có trim, lá không dài nhất)
// ===========================================================================
console.log("== G8. ghi hợp lệ vẫn qua ==");

test("G8: trim [0,4), lá đầu [0,2) thu còn 1 (max vẫn 4) → ok:true, validate rỗng", () => {
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", kind: "video", clips: [videoLeaf("c1", 0, 2), videoLeaf("c2", 2, 2)] }]),
    4,
    { in: 0, out: 4 },
  ));
  const res = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "c1", { duration: 1 });
  eq(res.ok, true, "nguồn mới vẫn 4 >= trim.out nên cho qua");
  eq(innerNow(topNow(), "it1", "c1").duration, 1, "lá đầu còn 1");
  assertValid(topNow(), "G8");
});

// ===========================================================================
// G9. Lệnh bị chặn không sinh entry undo
// ===========================================================================
console.log("== G9. lệnh bị chặn + undo ==");

test("G9: sửa hợp lệ rồi sửa bị chặn, undo 1 lần quay về trạng thái trước sửa hợp lệ", () => {
  install(nestedTop(
    "n1",
    subSpec([{ id: "it1", kind: "video", clips: [videoLeaf("c1", 0, 2), videoLeaf("c2", 2, 2)] }]),
    4,
    { in: 0, out: 4 },
  ));
  const ok1 = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "c1", { duration: 1 });
  eq(ok1.ok, true, "sửa hợp lệ phải ok");
  eq(innerNow(topNow(), "it1", "c1").duration, 1, "c1 còn 1 sau sửa hợp lệ");
  const blocked = useStore.getState().updateNestedInnerClip("v1", "n1", "it1", "c2", { duration: 1 });
  eq(blocked.ok, false, "sửa c2 phải bị chặn (nguồn 4→3 < trim.out 4)");
  eq(innerNow(topNow(), "it1", "c2").duration, 2, "c2 không đổi");
  useStore.getState().undo();
  eq(innerNow(topNow(), "it1", "c1").duration, 2, "undo 1 lần quay về c1=2: lệnh chặn không sinh entry");
});

console.log(`\nstore.nestedGuard: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`);
process.exitCode = fail > 0 ? 1 : 0;
