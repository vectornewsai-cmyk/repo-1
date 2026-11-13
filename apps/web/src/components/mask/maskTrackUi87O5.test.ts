// maskTrackUi87O5.test.ts — Phase 9 đợt 87, luồng O5: mask bám motion
// track — UI gắn track + i18n.
//
// NỘI DUNG:
//   A. Fragment round87-o5.json: đúng 7 key mới, vi/en parity, placeholder
//      khớp, không rỗng, vi khác en, không đụng key đã có trong dict chính
//      (parent gộp fragment vào vi.json/en.json ở cuối đợt — xem mẫu M1
//      đợt 56: KHÔNG sửa dict trực tiếp để khỏi xung đột luồng song song).
//   B. PARITY_ANIMATIONS trong TrackPanel.tsx KHỚP
//      server/render/src/textAnimParity.js (chống lệch với validator).
//   C. Source wiring: MaskPanel/TrackPanel gọi t()/i18nT() đúng key mới,
//      không còn literal VI cứng cho các chuỗi này (khóa quét i18n sweep);
//      component dùng đúng helper quyết định nhánh.
//   D. Probe logic thuần (không mock store): maskTrackUiState +
//      trackIgnoredReason trả đúng nhánh cho mọi tổ hợp track/mask/
//      typewriter/karaoke/parity/transition — đây là code quyết định hint
//      hiển thị, test trực tiếp thay vì render qua store.
//   E. SSR smoke: render 2 panel với state khởi tạo không crash
//      (MaskPanel → tipSelect, TrackPanel → rỗng).
//
// VÌ SAO D KHÔNG RENDER QUA STORE: renderToStaticMarkup dùng
// getServerSnapshot của zustand nên luôn thấy state lúc khởi tạo, dù
// useStore.setState đã đổi selection/spec (đã chứng minh bằng probe ngày
// 11/11: state sau setState đúng nhưng panel vẫn render nhánh tipSelect).
// Đây là giới hạn đã ghi trong repo (L1 đợt 55, nhánh dirty của ProjectMenu
// cũng chỉ đo được bằng probe + ghi LIMITS). Render đầy đủ các nhánh cần
// click-test trên browser thật (xem LIMITS O5 §5).
//
// Chạy bằng esbuild bundle (mẫu M1/splitPatch, chạy từ gốc repo; bundle ra
// scratch ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì store kéo
// validate.js dùng require động:
//   ./node_modules/.bin/esbuild apps/web/src/components/mask/maskTrackUi87O5.test.ts \
//     --bundle --platform=node --format=cjs \
//     --outfile=/tmp/round87-o5/maskTrackUi87O5.test.cjs --log-level=warning \
//     && node /tmp/round87-o5/maskTrackUi87O5.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MaskPanel, maskTrackUiState } from "./MaskPanel";
import { TrackPanel, trackIgnoredReason } from "../sticker/TrackPanel";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`O5 mask-track UI round 87: ${pass}/${queue.length} pass`);
}

// --- Dict: fragment + main ---------------------------------------------
type Dict = Record<string, unknown>;
function readJson(rel: string): Dict {
  return JSON.parse(readFileSync(rel, "utf8")) as Dict;
}
function flatten(d: Dict, prefix = "", out = new Map<string, string>()): Map<string, string> {
  for (const k of Object.keys(d)) {
    const q = prefix ? `${prefix}.${k}` : k;
    const v = d[k];
    if (typeof v === "object" && v !== null) flatten(v as Dict, q, out);
    else out.set(q, v as string);
  }
  return out;
}
function placeholders(s: string): string[] {
  return [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
}
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}

const FRAG = readJson("apps/web/src/i18n/fragments/round87-o5.json");
const FRAG_VI = flatten((FRAG.vi ?? {}) as Dict);
const FRAG_EN = flatten((FRAG.en ?? {}) as Dict);
const MAIN_VI = flatten(readJson("apps/web/src/i18n/vi.json"));
const MAIN_EN = flatten(readJson("apps/web/src/i18n/en.json"));

// 7 key mới của O5 + 1 key closing parent (maskStillFollows — mask vẫn bám
// qua transition, O6 C6 + parent verify png+transition): [vi, en].
const EXPECTED: Record<string, [string, string]> = {
  "mask.trackFollow": [
    "🎯 Mask đang bám theo motion track — tâm mask di chuyển theo quỹ đạo gắn trên clip (gỡ quỹ đạo sẽ dừng cả clip lẫn mask).",
    "🎯 The mask is following the motion track — the mask center moves along the trajectory attached to this clip (detaching the trajectory stops both the clip and the mask).",
  ],
  "mask.trackDetach": ["Gỡ quỹ đạo khỏi clip", "Detach trajectory from clip"],
  "mask.trackAttachHint": [
    "Mask đang đứng yên. Gắn motion track cho clip để mask bám theo vật thể.",
    "The mask is standing still. Attach a motion track to this clip so the mask follows the object.",
  ],
  "mask.trackAttachBtn": ["🎯 Gắn motion track…", "🎯 Attach motion track…"],
  "motionTrack.assIgnored": [
    "⚠️ Clip chữ vẽ bằng ASS ({reason}) nên motion track bị bỏ qua khi render — chữ giữ vị trí tĩnh (xem D3_LIMITS.md).",
    "⚠️ This text clip is drawn with ASS ({reason}), so the motion track is ignored at render — the text stays still (see D3_LIMITS.md).",
  ],
  "motionTrack.transitionIgnored": [
    "⚠️ Clip có transition nên motion track bị bỏ qua ở unit đã merge (xem D3_LIMITS.md).",
    "⚠️ This clip has a transition, so the motion track is ignored on the merged unit (see D3_LIMITS.md).",
  ],
  "motionTrack.maskNotFollowing": [
    "Mask cũng không bám theo track.",
    "The mask does not follow the track either.",
  ],
  "motionTrack.maskStillFollows": [
    "Mask vẫn bám theo track qua đoạn transition (chỉ phần dịch chuyển của clip bị bỏ qua ở đoạn merge).",
    "The mask still follows the track through the transition (only the clip's shift is skipped on the merged unit).",
  ],
};

// --- A. Fragment --------------------------------------------------------
ok("fragment: đúng 8 key mới, vi/en parity, placeholder khớp, vi khác en", () => {
  assert.equal(FRAG_VI.size, 8, `fragment vi phải có 8 key, nhận ${FRAG_VI.size}`);
  assert.equal(FRAG_EN.size, 8, `fragment en phải có 8 key, nhận ${FRAG_EN.size}`);
  for (const [k, [vi, en]] of Object.entries(EXPECTED)) {
    assert.equal(FRAG_VI.get(k), vi, `${k}: vi lệch fragment`);
    assert.equal(FRAG_EN.get(k), en, `${k}: en lệch fragment`);
    assert.ok(vi.length > 0 && en.length > 0, `${k}: chuỗi rỗng`);
    assert.notEqual(vi, en, `${k}: vi phải khác en`);
    assert.deepEqual(placeholders(vi), placeholders(en), `${k}: placeholder vi/en lệch`);
  }
});

ok("fragment: 8 key mới đã có trong dict chính (parent gộp cuối đợt 87)", () => {
  for (const k of Object.keys(EXPECTED)) {
    assert.ok(MAIN_VI.has(k), `vi.json thiếu key ${k} — parent chưa gộp fragment`);
    assert.ok(MAIN_EN.has(k), `en.json thiếu key ${k} — parent chưa gộp fragment`);
    assert.equal(MAIN_VI.get(k), FRAG_VI.get(k), `vi.json lệch fragment ở ${k}`);
    assert.equal(MAIN_EN.get(k), FRAG_EN.get(k), `en.json lệch fragment ở ${k}`);
  }
});

// --- B. Parity list khớp render ------------------------------------------
function parityList(src: string): string[] {
  const m = src.match(/PARITY_ANIMATIONS\s*=\s*\[([^\]]+)\]/);
  if (!m) throw new Error("không tìm thấy PARITY_ANIMATIONS");
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]).sort();
}
ok("parity: PARITY_ANIMATIONS trong TrackPanel khớp textAnimParity.js", () => {
  const ui = parityList(readSrc("components/sticker/TrackPanel.tsx"));
  const render = parityList(readFileSync("server/render/src/textAnimParity.js", "utf8"));
  assert.deepEqual(ui, render, `UI ${JSON.stringify(ui)} lệch render ${JSON.stringify(render)}`);
  assert.deepEqual(ui, ["curtainIn", "skewIn", "slideReveal", "tiltIn"]);
});

// --- C. Source wiring -----------------------------------------------------
ok("source: 2 panel gọi t()/i18nT() đúng key mới, không literal VI cứng", () => {
  const maskSrc = readSrc("components/mask/MaskPanel.tsx");
  const trackSrc = readSrc("components/sticker/TrackPanel.tsx");
  const both = maskSrc + "\n" + trackSrc;
  for (const k of Object.keys(EXPECTED)) {
    assert.ok(
      both.includes(`i18nT("${k}")`) || both.includes(`t("${k}"`),
      `không panel nào gọi t("${k}")`,
    );
  }
  // Chuỗi VI mới không được hardcode trong component (phải đi qua dict).
  for (const [k, [vi]] of Object.entries(EXPECTED)) {
    assert.ok(!both.includes(vi), `${k}: literal VI còn cứng trong component`);
  }
  // Key mới phải nằm đúng panel sở hữu: mask.* ở MaskPanel, motionTrack.* ở TrackPanel.
  for (const k of ["mask.trackFollow", "mask.trackDetach", "mask.trackAttachHint", "mask.trackAttachBtn"]) {
    assert.ok(maskSrc.includes(`i18nT("${k}")`), `MaskPanel thiếu i18nT("${k}")`);
  }
  for (const k of ["motionTrack.assIgnored", "motionTrack.transitionIgnored", "motionTrack.maskNotFollowing"]) {
    assert.ok(trackSrc.includes(`t("${k}"`), `TrackPanel thiếu t("${k}")`);
  }
});

ok("source: component dùng helper quyết định nhánh (không tính tay trong JSX)", () => {
  const maskSrc = readSrc("components/mask/MaskPanel.tsx");
  const trackSrc = readSrc("components/sticker/TrackPanel.tsx");
  assert.ok(maskSrc.includes("maskTrackUiState(clip"), "MaskPanel không dùng maskTrackUiState");
  assert.ok(maskSrc.includes('trackUi === "follow"'), "MaskPanel không rẽ nhánh follow bằng trackUi");
  assert.ok(maskSrc.includes('trackUi === "transition"'), "MaskPanel không rẽ nhánh transition bằng trackUi");
  assert.ok(trackSrc.includes("trackIgnoredReason(rawClip)"), "TrackPanel không dùng trackIgnoredReason");
  assert.ok(trackSrc.includes("!trackIgnored"), "TrackPanel không ẩn followNote khi trackIgnored");
  assert.ok(trackSrc.includes('ignored.kind === "ass"'), "TrackPanel không rẽ nhánh ass/transition");
});

// --- D. Probe logic thuần --------------------------------------------------
const TRACK = {
  points: [
    { t: 0, x: 0.25, y: 0.5 },
    { t: 2, x: 0.75, y: 0.5 },
  ],
  source: "track.py",
};
const MASK = { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 };
const FADE = { type: "fade", duration: 0.5 };

function video(over: Record<string, unknown>): Parameters<typeof maskTrackUiState>[0] {
  return { kind: "video", mask: MASK, track: TRACK, ...over };
}
function text(over: Record<string, unknown>): Parameters<typeof trackIgnoredReason>[0] {
  return { kind: "text", style: { animation: "fadeUp" }, ...over };
}

ok("D1 maskTrackUiState: video mask+track → follow", () => {
  assert.equal(maskTrackUiState(video({})), "follow");
});
ok("D2 maskTrackUiState: video mask, chưa track → attach", () => {
  assert.equal(maskTrackUiState(video({ track: undefined })), "attach");
});
ok("D3 maskTrackUiState: video mask+track+transition → transition (cả 2 đầu)", () => {
  assert.equal(maskTrackUiState(video({ transitionOut: FADE })), "transition");
  assert.equal(maskTrackUiState(video({ transitionIn: FADE })), "transition");
});
ok("D4 maskTrackUiState: clip ảnh mask+track → none (ảnh không gắn track)", () => {
  assert.equal(maskTrackUiState({ kind: "image", mask: MASK, track: TRACK }), "none");
});
ok("D5 maskTrackUiState: video có track nhưng chưa có mask → none", () => {
  assert.equal(maskTrackUiState({ kind: "video", track: TRACK }), "none");
});
ok("D6 maskTrackUiState: video mask+track nhưng mask rỗng vẫn follow (chỉ kiểm tra có/không)", () => {
  assert.equal(maskTrackUiState(video({ mask: { ...MASK, feather: 1 } })), "follow");
});

ok("D7 trackIgnoredReason: text typewriter → ass/typewriter", () => {
  assert.deepEqual(
    trackIgnoredReason(text({ style: { animation: "typewriter" } })),
    { kind: "ass", reason: "typewriter" },
  );
});
ok("D8 trackIgnoredReason: text karaoke → ass/karaoke (thắng cả typewriter)", () => {
  assert.deepEqual(
    trackIgnoredReason(text({ karaoke: [{ word: "Hi", start: 0, end: 0.5 }] })),
    { kind: "ass", reason: "karaoke" },
  );
  assert.deepEqual(
    trackIgnoredReason(text({ style: { animation: "typewriter" }, karaoke: [{ word: "Hi", start: 0, end: 0.5 }] })),
    { kind: "ass", reason: "karaoke" },
  );
});
ok("D9 trackIgnoredReason: 4 animation parity → ass/<tên anim>", () => {
  for (const anim of ["tiltIn", "skewIn", "slideReveal", "curtainIn"]) {
    assert.deepEqual(
      trackIgnoredReason(text({ style: { animation: anim } })),
      { kind: "ass", reason: anim },
      `parity ${anim}`,
    );
  }
});
ok("D10 trackIgnoredReason: text fadeUp / không animation / karaoke rỗng → null (track có tác dụng)", () => {
  assert.equal(trackIgnoredReason(text({})), null);
  assert.equal(trackIgnoredReason(text({ style: { animation: "none" } })), null);
  assert.equal(trackIgnoredReason(text({ karaoke: [] })), null);
  assert.equal(trackIgnoredReason(text({ style: undefined })), null);
});
ok("D11 trackIgnoredReason: video + transition → transition; video thường / sticker → null", () => {
  assert.deepEqual(
    trackIgnoredReason({ kind: "video", transitionIn: FADE }),
    { kind: "transition" },
  );
  assert.deepEqual(
    trackIgnoredReason({ kind: "video", transitionOut: FADE }),
    { kind: "transition" },
  );
  assert.equal(trackIgnoredReason({ kind: "video" }), null);
  assert.equal(trackIgnoredReason({ kind: "sticker" }), null);
});

// --- E. SSR smoke ---------------------------------------------------------
ok("E1 SSR smoke: MaskPanel với state khởi tạo render tipSelect, không crash", () => {
  const html = renderToStaticMarkup(React.createElement(MaskPanel));
  assert.ok(html.includes("mask.tipSelect") || html.includes("Chọn một clip video hoặc ảnh"), `MaskPanel SSR lạ: ${html.slice(0, 120)}`);
  for (const k of Object.keys(EXPECTED)) {
    assert.ok(!html.includes(k), `SSR state khởi tạo mà lộ key track: ${k}`);
  }
});
ok("E2 SSR smoke: TrackPanel với state khởi tạo render rỗng, không crash", () => {
  const html = renderToStaticMarkup(React.createElement(TrackPanel));
  assert.equal(html, "", `TrackPanel SSR phải rỗng khi chưa chọn clip, nhận: ${html.slice(0, 120)}`);
});

runAll();
