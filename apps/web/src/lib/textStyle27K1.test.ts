/**
 * textStyle27K1.test.ts — Test tái hiện + hồi quy bug đợt 26 J6 §6
 * (Phase 9 đợt 27, luồng K1): text clip không có `style` làm preview
 * ném exception lúc load (stack tới drawTextClip đọc clip.style.animation
 * khi style undefined; seed TEXT-BLOCKED-LEAF của I6).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping, mẫu projectRepoRound26J5.test.ts):
 *   node apps/web/src/lib/textStyle27K1.test.ts
 *
 * drawTextClip trong preview.tsx không export nên không gọi trực tiếp
 * được từ test Node; test này khóa hai tầng mà luồng K1 sửa:
 *  (1) cổng load parseProjectText phải chuẩn hóa style (top-level + nested);
 *  (2) mô phỏng đúng các lần đọc của drawTextClip/textFont trên clip đã
 *      load (style.animation, style.fontSize, textFont) phải không ném.
 * Lớp guard trong preview.tsx dùng chung normalizeTextStyle nên (1)
 * khóa luôn logic của guard; xem LIMITS K1 về giới hạn này.
 */
import {
  normalizeTextStyle,
  parseProjectText,
} from "./projectRepo.ts";

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

function eq(a: unknown, b: unknown, msg: string): void {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${msg} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
  }
}

/** Mô phỏng đúng các lần đọc style của drawTextClip/textFont (preview.tsx). */
function previewStyleReads(clip: Record<string, any>): void {
  // textFont: s.italic / s.bold / s.fontSize / s.fontFamily
  const s = clip.style;
  const font = `${s.italic ? "italic " : ""}${s.bold ? "700 " : "400 "}${s.fontSize}px ${s.fontFamily}`;
  assert(typeof font === "string" && font.length > 0, "textFont phải ra chuỗi");
  // drawTextClip: style.animation + style.fontSize * 1.35
  void (s.animation !== "typewriter");
  const textH = s.fontSize * 1.35;
  assert(Number.isFinite(textH) && textH > 0, "textH phải hữu hạn > 0");
  // drawTextClip: style.color / style.backgroundColor (đọc, có thể undefined)
  void s.color;
  void s.backgroundColor;
}

function specJson(tracks: unknown[]): string {
  return JSON.stringify({
    format: "vcut-project",
    formatVersion: 1,
    appVersion: "0.1.0",
    specVersion: "0.2.0",
    savedAt: "2026-10-31T00:00:00.000Z",
    name: "repro-k1",
    spec: {
      version: "0.2.0",
      meta: { name: "repro-k1", width: 1080, height: 1920, fps: 30 },
      tracks,
    },
  });
}

function textTrack(id: string, clips: unknown[]): unknown {
  return { id, kind: "text", label: id, clips };
}

console.log("textStyle27K1:");

test("tái hiện: text clip top-level không style load xong vẫn đọc preview được", () => {
  const res = parseProjectText(
    specJson([
      textTrack("t1", [
        { kind: "text", id: "c1", text: "Hello", start: 0, duration: 3 },
      ]),
    ]),
  );
  assert(res.ok, `load phải ok, errors=${JSON.stringify(res.errors)}`);
  const clip = (res.spec as any).tracks[0].clips[0];
  assert(clip.style !== undefined, "clip sau load phải có style (bug: undefined)");
  previewStyleReads(clip);
});

test("tái hiện: text clip trong nested (seed kiểu TEXT-BLOCKED-LEAF) cũng được chuẩn hóa", () => {
  const res = parseProjectText(
    specJson([
      {
        id: "n1",
        kind: "video",
        label: "nested",
        clips: [
          {
            kind: "nested",
            id: "nest1",
            start: 0,
            duration: 6,
            subSpec: {
              version: "0.2.0",
              meta: { name: "inner", width: 1080, height: 1920, fps: 30 },
              tracks: [
                textTrack("it1", [
                  { kind: "text", id: "leaf1", text: "Leaf", start: 0, duration: 3 },
                ]),
              ],
            },
          },
        ],
      },
    ]),
  );
  assert(res.ok, `load phải ok, errors=${JSON.stringify(res.errors)}`);
  const leaf = (res.spec as any).tracks[0].clips[0].subSpec.tracks[0].clips[0];
  assert(leaf.style !== undefined, "lá nested sau load phải có style (bug: undefined)");
  previewStyleReads(leaf);
  assert(
    (res as any).textStyleFixes?.some((p: string) => p.includes("leaf1")),
    `textStyleFixes phải ghi đường dẫn lá, got ${JSON.stringify((res as any).textStyleFixes)}`,
  );
});

test("style từng phần được điền field thiếu, giữ nguyên field đã có", () => {
  const res = parseProjectText(
    specJson([
      textTrack("t1", [
        {
          kind: "text",
          id: "c1",
          text: "Hi",
          start: 0,
          duration: 3,
          style: { fontSize: 40, color: "#ff0000", backgroundColor: "#000000" },
        },
      ]),
    ]),
  );
  assert(res.ok, `load phải ok, errors=${JSON.stringify(res.errors)}`);
  const s = (res.spec as any).tracks[0].clips[0].style;
  eq(s.fontSize, 40, "fontSize đã có phải giữ nguyên");
  eq(s.color, "#ff0000", "color đã có phải giữ nguyên");
  eq(s.backgroundColor, "#000000", "backgroundColor đã có phải giữ nguyên");
  assert(typeof s.fontFamily === "string" && s.fontFamily.length > 0, "fontFamily thiếu phải được điền");
  assert(s.animation === "none", "animation thiếu phải điền 'none' (trung tính, không thêm hiệu ứng)");
  assert(s.x === 0.5 && s.y === 0.5, "x/y thiếu phải điền 0.5 (giữa, khớp fallback previewEngine)");
  previewStyleReads((res.spec as any).tracks[0].clips[0]);
});

test("clip đã có style đầy đủ không bị đổi hành vi (deep-equal)", () => {
  const full = {
    fontFamily: "Be Vietnam Pro",
    fontSize: 72,
    color: "#ffffff",
    bold: true,
    italic: false,
    x: 0.5,
    y: 0.38,
    animation: "fadeUp",
  };
  const res = parseProjectText(
    specJson([
      textTrack("t1", [
        { kind: "text", id: "c1", text: "Hi", start: 0, duration: 3, style: full },
      ]),
    ]),
  );
  assert(res.ok, `load phải ok, errors=${JSON.stringify(res.errors)}`);
  eq((res.spec as any).tracks[0].clips[0].style, full, "style đầy đủ phải giữ nguyên từng field");
  eq((res as any).textStyleFixes ?? [], [], "không có clip nào cần sửa thì fixes rỗng");
});

test("normalizeTextStyle: undefined và kiểu sai đều về default đầy đủ", () => {
  const a = normalizeTextStyle(undefined);
  assert(a.fontSize === 64 && a.color === "#ffffff" && a.animation === "none", "undefined phải về default");
  previewStyleReads({ style: a });
  const b = normalizeTextStyle({ fontSize: "big", x: Number.NaN, animation: "khong-ton-tai" });
  assert(b.fontSize === 64, "fontSize kiểu sai phải về 64");
  assert(b.x === 0.5, "x NaN phải về 0.5");
  assert(b.animation === "none", "animation lạ phải về 'none'");
  const c = normalizeTextStyle({ fontSize: -5 });
  assert(c.fontSize === 64, "fontSize <= 0 phải về 64");
});

test("clip không phải text không bị đụng (video thiếu style vẫn load như cũ)", () => {
  const res = parseProjectText(
    specJson([
      {
        id: "v1",
        kind: "video",
        label: "v",
        clips: [{ kind: "video", id: "v1", src: "a.mp4", start: 0, duration: 4, in: 0, out: 4 }],
      },
    ]),
  );
  assert(res.ok, `load phải ok, errors=${JSON.stringify(res.errors)}`);
  assert((res.spec as any).tracks[0].clips[0].style === undefined, "clip video không được gán style");
});

console.log(`\ntextStyle27K1: ${pass} pass, ${fail} fail${fail ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
