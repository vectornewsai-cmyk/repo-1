/**
 * relinkEdge45A3.test.ts — Kiểm tra relink ở biên bằng logic thuần
 * (Phase 9 đợt 45, luồng A3 — đóng nợ đợt 44 Z3 §2 về relink).
 *
 * PHẠM VI CỐ TÌNH HẸP: chỉ test `findMissingAssets` / `relinkAsset`
 * trong `relink.ts` (pure, không DOM/store). KHÔNG sửa `store.ts` hay
 * `relink.ts` trong luồng này — mọi bug phát hiện được chỉ khóa hành vi
 * hiện tại bằng test + báo cáo trong LIMITS, để luồng khác/đợt sau sửa.
 * Hành vi thuộc tầng store (đổi tên dedup " (1)", probe duration của
 * file thật, kích thước file) KHÔNG test được ở tầng thuần và được ghi
 * rõ là giới hạn, không suy diễn.
 *
 * Khóa:
 * 1. Tên trùng: 2 clip cùng src → quét gộp count 2, relink đổi cả 2.
 * 2. Ký tự đặc biệt: tên kiểu dedup " (1)", tiếng Việt có dấu, dấu
 *    nháy/ngoặc/#, emoji — relink khớp chuỗi chính xác.
 * 3. "File nhỏ" ở tầng thuần: tên 1 ký tự, tên không đuôi — tầng thuần
 *    không hề nhìn kích thước (không có khái niệm size trong spec), nên
 *    relink đúng như file thường; kích thước chỉ có ý nghĩa ở tầng
 *    store/probe, ngoài phạm vi test này.
 * 4. Quan sát đã đính chính (giả thuyết bug ban đầu SAI, test đã sửa
 *    sau khi chạy thật): nested clip mang trường src KHÔNG được cả quét
 *    lẫn relink tính đến — `srcOf` chỉ nhận kind video/audio/image/
 *    sticker nên src của clip kind "nested" là dữ liệu chết, bị cả hai
 *    phía bỏ qua một cách NHẤT QUÁN (quét đếm 1 = lá con, relink đổi
 *    đúng lá con). Không có bất nhất quét-vs-relink ở biên này; trường
 *    src trên nested chỉ là dữ liệu thừa, không gây kẹt panel.
 * 5. Quan sát chuẩn hóa Unicode: tên NFC vs NFD chỉ khác dạng chuẩn hóa
 *    thì relink khớp chính xác trả 0 — rủi ro thực tế trên macOS (tên
 *    file NFD) là giả thuyết chưa chứng minh qua UI, ghi trong LIMITS.
 *
 * Chạy bằng esbuild bundle (quy ước đợt 45):
 *   ./node_modules/.bin/esbuild apps/web/src/lib/relinkEdge45A3.test.ts \
 *     --bundle --format=esm --platform=node --outfile=/tmp/relink45a3.test.mjs
 *   node /tmp/relink45a3.test.mjs
 */
import { findMissingAssets, relinkAsset } from "./relink";
import type { Clip, Track, VideoSpec } from "@repo-1/video-spec";

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

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq<T>(a: T, b: T, msg: string): void {
  if (a !== b) throw new Error(`${msg} — nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`);
}

/** Clip lá video thường. */
function leaf(id: string, src: string): Clip {
  return {
    kind: "video", id, src, start: 0, duration: 4, in: 0, out: 4, opacity: 1,
  } as unknown as Clip;
}

/** Nested clip chuẩn (subSpec) — có thể tự mang src (dữ liệu hỏng). */
function nested(id: string, subTracks: Track[], ownSrc?: string): Clip {
  return {
    kind: "nested", id, start: 0, duration: 4,
    ...(ownSrc !== undefined ? { src: ownSrc } : {}),
    subSpec: {
      meta: { name: id, width: 640, height: 360, fps: 30 },
      tracks: subTracks,
    } as unknown as VideoSpec["tracks"],
    trim: { in: 0, out: 4 },
  } as unknown as Clip;
}

function track(id: string, clips: Clip[]): Track {
  return { id, kind: "video", clips } as Track;
}

function spec(tracks: Track[]): VideoSpec {
  return {
    meta: { name: "t", width: 640, height: 360, fps: 30 },
    tracks,
  } as unknown as VideoSpec;
}

function srcsOf(s: VideoSpec): string[] {
  const out: string[] = [];
  const walk = (tracks: Track[]): void => {
    for (const t of tracks) {
      for (const c of t.clips ?? []) {
        const rec = c as unknown as Record<string, unknown>;
        if (typeof rec["src"] === "string") out.push(rec["src"] as string);
        const sub = rec["subSpec"] as { tracks?: Track[] } | undefined;
        if (sub && Array.isArray(sub.tracks)) walk(sub.tracks);
      }
    }
  };
  walk(s.tracks ?? []);
  return out;
}

// ---------------------------------------------------------------------------
// 1. Tên trùng
// ---------------------------------------------------------------------------

test("tên trùng: 2 clip cùng src → quét count 2, relink đổi cả 2, không mutate input", () => {
  const s = spec([track("v", [leaf("c1", "shared.mp4"), leaf("c2", "shared.mp4"), leaf("c3", "other.mp4")])]);
  const m = findMissingAssets(s, new Set());
  eq(m.length, 2, "2 src thiếu khác nhau");
  eq(m.find((x) => x.src === "shared.mp4")?.clipCount, 2, "shared count 2");
  const r = relinkAsset(s, "shared.mp4", "shared-new.mp4");
  eq(r.updatedCount, 2, "đổi 2 clip");
  eq(srcsOf(r.spec).join(","), "shared-new.mp4,shared-new.mp4,other.mp4", "đúng 2 clip đổi, clip khác giữ nguyên");
  eq(srcsOf(s).join(","), "shared.mp4,shared.mp4,other.mp4", "input không bị mutate");
});

test("tên trùng khác kind: video + image cùng chuỗi src đều đổi (khóa theo src, không theo kind)", () => {
  const img = { kind: "image", id: "im1", src: "same.mp4", start: 0, duration: 2 } as unknown as Clip;
  const s = spec([track("v", [leaf("c1", "same.mp4"), img])]);
  const r = relinkAsset(s, "same.mp4", "renamed.mp4");
  eq(r.updatedCount, 2, "cả video và image cùng src đều đổi");
});

// ---------------------------------------------------------------------------
// 2. Ký tự đặc biệt
// ---------------------------------------------------------------------------

test("ký tự đặc biệt: dedup ' (1)', tiếng Việt, nháy/ngoặc/#, emoji đều relink đúng", () => {
  const names = [
    "clip (1).mp4",
    "phim cuối tuần — bản 2.mp4",
    "a'b\"c.mp4",
    "clip [final] #3.mp4",
    "🎬 intro.mp4",
    "tên có  nhiều   khoảng trắng.mp4",
  ];
  for (const name of names) {
    const s = spec([track("v", [leaf("c1", name)])]);
    const r = relinkAsset(s, name, `new-${name}`);
    eq(r.updatedCount, 1, `relink tên ${JSON.stringify(name)}`);
    eq(srcsOf(r.spec)[0], `new-${name}`, `src mới của ${JSON.stringify(name)}`);
  }
});

test("phân biệt hoa/thường và khoảng trắng: khớp chính xác, không normalize ngầm", () => {
  const s = spec([track("v", [leaf("c1", "Clip.mp4")])]);
  eq(relinkAsset(s, "clip.mp4", "x.mp4").updatedCount, 0, "khác hoa/thường → 0 (khớp chính xác)");
  eq(relinkAsset(s, " Clip.mp4", "x.mp4").updatedCount, 0, "thừa khoảng trắng đầu → 0");
  eq(relinkAsset(s, "Clip.mp4", "x.mp4").updatedCount, 1, "khớp chính xác → 1");
});

// ---------------------------------------------------------------------------
// 3. "File nhỏ" ở tầng thuần + biên tên
// ---------------------------------------------------------------------------

test("tên biên: 1 ký tự, không đuôi, chỉ có đuôi — tầng thuần không quan tâm kích thước", () => {
  // Tầng thuần không có trường size nào trong spec: "file nhỏ" và file
  // lớn đi qua cùng một đường relink; kích thước chỉ có ý nghĩa ở tầng
  // store (probe duration/size) — ngoài phạm vi test này.
  for (const name of ["a.mp4", "clip", ".mp4"]) {
    const s = spec([track("v", [leaf("c1", name)])]);
    const r = relinkAsset(s, name, `new-${name}`);
    eq(r.updatedCount, 1, `relink tên biên ${JSON.stringify(name)}`);
  }
});

test("biên: old==new → 0 và giữ nguyên spec (ngữ nghĩa Z3 khóa, relinkMedia đã xử lý riêng)", () => {
  const s = spec([track("v", [leaf("c1", "a.mp4")])]);
  const r = relinkAsset(s, "a.mp4", "a.mp4");
  eq(r.updatedCount, 0, "old==new → 0");
  assert(r.spec === s, "old==new trả đúng ref spec cũ");
});

test("biên: oldSrc rỗng → 0 (không clip nào có src rỗng theo srcOf)", () => {
  const s = spec([track("v", [leaf("c1", "a.mp4")])]);
  eq(relinkAsset(s, "", "x.mp4").updatedCount, 0, "oldSrc rỗng không khớp clip nào");
});

test("không có guard va chạm ở tầng thuần: relink sang tên đã tồn tại thì 2 clip cùng trỏ 1 src", () => {
  // Guard chống va chạm nằm ở tầng store (vòng rename " (1)" trong
  // relinkMedia) chứ không nằm ở relinkAsset thuần — khóa đúng hành vi
  // hiện tại để không ai tưởng tầng thuần đã chặn va chạm.
  const s = spec([track("v", [leaf("c1", "a.mp4"), leaf("c2", "b.mp4")])]);
  const r = relinkAsset(s, "a.mp4", "b.mp4");
  eq(r.updatedCount, 1, "đổi 1 clip");
  eq(srcsOf(r.spec).join(","), "b.mp4,b.mp4", "sau relink 2 clip cùng trỏ b.mp4");
});

// ---------------------------------------------------------------------------
// 4. KNOWN-BUG: nested mang src + lá con cùng src
// ---------------------------------------------------------------------------

test("đính chính 45A3: src trên clip nested bị cả quét lẫn relink bỏ qua NHẤT QUÁN (không phải bug)", () => {
  // Giả thuyết ban đầu của luồng ("quét 2, relink 1") đã bị test chạy
  // thật bác bỏ: srcOf chỉ nhận kind video/audio/image/sticker nên
  // trường src của clip kind "nested" không được tính ở phía nào.
  // Kết quả: quét đếm đúng lá con (1), relink đổi đúng lá con (1),
  // trường src của nested giữ nguyên nhưng vô hại vì app không đọc nó
  // qua srcOf. Không sửa relink.ts; ghi trong LIMITS §3.
  const inner = track("in", [leaf("child", "dup.mp4")]);
  const s = spec([track("v", [nested("comp", [inner], "dup.mp4")])]);
  const m = findMissingAssets(s, new Set());
  eq(m.length, 1, "quét gộp 1 entry");
  eq(m[0].clipCount, 1, "quét chỉ đếm lá con, không đếm src của nested");
  const r = relinkAsset(s, "dup.mp4", "fixed.mp4");
  eq(r.updatedCount, 1, "relink đổi đúng lá con");
  const after = r.spec.tracks[0].clips[0] as unknown as Record<string, unknown>;
  const sub = after["subSpec"] as { tracks: Track[] };
  eq((sub.tracks[0].clips[0] as unknown as Record<string, unknown>)["src"], "fixed.mp4", "lá con đã đổi");
  eq(after["src"], "dup.mp4", "src của nested giữ nguyên (app không đọc qua srcOf)");
});

test("đối chứng: nested không mang src thì lá con relink bình thường", () => {
  const s = spec([track("v", [nested("comp", [track("in", [leaf("child", "dup.mp4")])])])]);
  const r = relinkAsset(s, "dup.mp4", "fixed.mp4");
  eq(r.updatedCount, 1, "lá con đổi đúng");
  eq(srcsOf(r.spec)[0], "fixed.mp4", "lá con đã đổi");
});

// ---------------------------------------------------------------------------
// 5. Chuẩn hóa Unicode (quan sát, chưa chứng minh qua UI)
// ---------------------------------------------------------------------------

test("quan sát: NFC vs NFD chỉ khác dạng chuẩn hóa → relink trả 0 (khớp chuỗi chính xác)", () => {
  const nfc: string = "caf\u00e9.mp4"; // é = U+00E9 (dạng NFC, đã verify byte)
  const nfd: string = "cafe\u0301.mp4"; // e + U+0301 (dạng NFD, đã verify byte)
  assert(nfc !== nfd, "hai chuỗi phải khác nhau ở mức code unit thì test mới có ý nghĩa");
  const s = spec([track("v", [leaf("c1", nfc)])]);
  eq(relinkAsset(s, nfd, "fixed.mp4").updatedCount, 0, "NFD không khớp NFC");
  eq(relinkAsset(s, nfc, "fixed.mp4").updatedCount, 1, "NFC khớp NFC");
});

test("subSpec dùng lại ở 2 nhánh anh em: cả hai nhánh đều relink (không coi là vòng lặp)", () => {
  const sharedTracks = [track("in", [leaf("l", "shared.mp4")])];
  const mkNested = (id: string): Clip => nested(id, sharedTracks);
  const s = spec([track("v", [mkNested("A"), mkNested("B")])]);
  const r = relinkAsset(s, "shared.mp4", "fixed.mp4");
  eq(r.updatedCount, 2, "cả hai nhánh anh em đều đổi");
});

console.log(`\nrelinkEdge45A3: ${pass} pass, ${fail} fail`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
