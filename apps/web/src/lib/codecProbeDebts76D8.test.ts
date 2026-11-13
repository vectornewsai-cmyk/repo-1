// codecProbeDebts76D8.test.ts — Phase 9 đợt 76, luồng D8 (đóng 3 nợ
// đợt 75 C6 §4: race project mẫu xóa file vừa import (§4.7), modal
// codec chưa đóng bằng Escape (§4.6), clip timeline chưa có badge
// (§4.8)).
//
// Chạy từ gốc repo: `node scripts/run-node-test.mjs
// apps/web/src/lib/codecProbeDebts76D8.test.ts` (bundle cjs qua
// esbuild). Không cần trình duyệt: merge mẫu là hàm thuần
// (lib/sampleLoadMerge76D8.ts); Escape + badge timeline kiểm chứng
// bằng kiểm tra tĩnh trên source (mẫu modalClasses59P4 — repo không
// có jsdom) + headed Chromium thật (xem
// docs/PHASE9_ROUND76_D8_CODEC_PROBE_DEBTS_LIMITS.md).
//
// LƯU Ý dict: luồng này KHÔNG thêm key i18n mới (badge timeline dùng
// lại key mediabin.codecBadgeTitle của C6) nên dict giữ 2413 lúc đó;
// đợt 76 D9 thêm 6 key exportPanel.aspectFit* → 2419; đợt 79 G9 thêm
// 6 key (5 openProject.archiveHistory* + 1 captions.trackLabel) → 2425; đợt 80 H7 thêm 10 key (4 reverseGate.* + 6 rehydrate.*) + 9 key đợt 80 H10 (social presets) → 2444; +17 key aiJob.* → 2461; +2 key đợt 81 I6 (aiJob.etaEstimating + aiJob.etaHours) → 2463; +2 key đợt 84 L9 (mediabin.proxyHeightLabel + mediabin.proxyNoOriginalFile) → 2465; +24 key đợt 84 L8 (18 tts.* + 6 bridgeErrors.*) → 2489; +11 key đợt 85 M7 (tts.* export/import giọng) → 2500; +7 key đợt 85 M8 (mediabin.proxy* progress/retry) → 2507; +7 key đợt 87 O5 (4 mask.* + 3 motionTrack.*) → 2514; +1 key closing (motionTrack.maskStillFollows) → 2515; +1 key đợt 88 P6 (validation.TRACK_IMAGE_MASK) → 2516.
// Test này chỉ khóa vi==en (không khóa số key) để luồng D9 thêm key sau
// không phải sửa file này; các test khóa số key do C6 giữ, D9 đã bump
// 2413 → 2419, G9 bump 2419 → 2425, H7 bump 2425 → 2444 (+10 key H7 + 9 key đợt 80 H10 (social presets)), +17 key aiJob.* → 2461; +2 key đợt 81 I6 → 2463; +2 key đợt 84 L9 → 2465; +24 key đợt 84 L8 → 2489; +11 key đợt 85 M7 → 2500; +7 key đợt 85 M8 → 2507; +7 key đợt 87 O5 → 2514; +1 key closing → 2515; +1 key đợt 88 P6 → 2516; +1 key đợt 91 S5 (motionTrack.title) → 2517; +1 key đợt 92 T5 (sticker.title) → 2518; +249 key đợt 93 U5 (5 sticker.cat.* + 244 sticker.item.*) → 2767.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mergeSampleLoad } from "./sampleLoadMerge76D8";
import type { VideoSpec } from "@repo-1/video-spec";
import type { MediaItem } from "../media";

declare const process: { exitCode: number | undefined };

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`D8 codec-probe debts round 76: ${pass}/${queue.length} pass`);
}

// --- Fixture ------------------------------------------------------------
function spec(name: string): VideoSpec {
  return {
    version: 1,
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [],
  } as unknown as VideoSpec;
}
function item(name: string, extra: Partial<MediaItem> = {}): MediaItem {
  return {
    id: `m-${name}`,
    name,
    kind: "video",
    url: `blob:${name}`,
    duration: 2,
    ...extra,
  } as unknown as MediaItem;
}
const SAMPLE_SPEC = spec("Dự án mẫu");
const SAMPLE_MEDIA = [item("mau-1.webm"), item("mau-2.webm")];

// --- mergeSampleLoad (thuần) --------------------------------------------
ok("merge: không thay đổi lúc bay → spec mẫu + media mẫu, không giữ spec", () => {
  const r = mergeSampleLoad({
    sampleSpec: SAMPLE_SPEC,
    sampleMedia: SAMPLE_MEDIA,
    specAtStart: SAMPLE_SPEC,
    curSpec: SAMPLE_SPEC,
    curMedia: [],
  });
  assert.equal(r.specPreserved, false);
  assert.equal(r.spec, SAMPLE_SPEC);
  assert.deepEqual(r.media.map((m) => m.name), ["mau-1.webm", "mau-2.webm"]);
});

ok("merge: import 1 file lúc bay → file còn trong bin sau media mẫu, spec vẫn là mẫu", () => {
  const r = mergeSampleLoad({
    sampleSpec: SAMPLE_SPEC,
    sampleMedia: SAMPLE_MEDIA,
    specAtStart: SAMPLE_SPEC,
    curSpec: SAMPLE_SPEC,
    curMedia: [item("hevc-a.mp4", { unsupportedCodec: "HEVC / MP4" })],
  });
  assert.equal(r.specPreserved, false);
  assert.equal(r.spec, SAMPLE_SPEC);
  assert.deepEqual(r.media.map((m) => m.name), ["mau-1.webm", "mau-2.webm", "hevc-a.mp4"]);
  assert.equal(r.media[2]?.unsupportedCodec, "HEVC / MP4");
});

ok("merge: import nhiều file lúc bay → giữ đủ, giữ thứ tự import", () => {
  const r = mergeSampleLoad({
    sampleSpec: SAMPLE_SPEC,
    sampleMedia: SAMPLE_MEDIA,
    specAtStart: SAMPLE_SPEC,
    curSpec: SAMPLE_SPEC,
    curMedia: [item("hevc-a.mp4"), item("hevc-b.mp4"), item("h264.mp4")],
  });
  assert.deepEqual(
    r.media.map((m) => m.name),
    ["mau-1.webm", "mau-2.webm", "hevc-a.mp4", "hevc-b.mp4", "h264.mp4"],
  );
});

ok("merge: user sửa timeline lúc bay (kéo clip lên) → giữ spec user, vẫn gộp media mẫu", () => {
  const userSpec = spec("Dự án của user");
  const r = mergeSampleLoad({
    sampleSpec: SAMPLE_SPEC,
    sampleMedia: SAMPLE_MEDIA,
    specAtStart: SAMPLE_SPEC,
    curSpec: userSpec,
    curMedia: [item("hevc-a.mp4")],
  });
  assert.equal(r.specPreserved, true);
  assert.equal(r.spec, userSpec);
  assert.deepEqual(r.media.map((m) => m.name), ["mau-1.webm", "mau-2.webm", "hevc-a.mp4"]);
});

ok("merge: bin đã có item trùng tên mẫu → không nhân đôi mau-*", () => {
  const r = mergeSampleLoad({
    sampleSpec: SAMPLE_SPEC,
    sampleMedia: SAMPLE_MEDIA,
    specAtStart: SAMPLE_SPEC,
    curSpec: SAMPLE_SPEC,
    curMedia: [item("mau-1.webm"), item("mau-2.webm"), item("hevc-a.mp4")],
  });
  assert.deepEqual(r.media.map((m) => m.name), ["mau-1.webm", "mau-2.webm", "hevc-a.mp4"]);
});

ok("merge: không mutate input (mảng mẫu + bin gốc giữ nguyên)", () => {
  const cur = [item("hevc-a.mp4")];
  const r = mergeSampleLoad({
    sampleSpec: SAMPLE_SPEC,
    sampleMedia: SAMPLE_MEDIA,
    specAtStart: SAMPLE_SPEC,
    curSpec: SAMPLE_SPEC,
    curMedia: cur,
  });
  assert.equal(SAMPLE_MEDIA.length, 2);
  assert.equal(cur.length, 1);
  assert.notEqual(r.media, SAMPLE_MEDIA);
  assert.notEqual(r.media, cur);
});

// --- Nối tĩnh: store.loadSample ------------------------------------------
const STORE = readFileSync("apps/web/src/store.ts", "utf8");
ok("store: loadSample chụp specAtStart trước await + gọi mergeSampleLoad", () => {
  assert.ok(STORE.includes("const specAtStart = get().spec;"), "thiếu chụp specAtStart");
  assert.ok(STORE.includes("mergeSampleLoad({"), "loadSample không gọi mergeSampleLoad");
  assert.ok(STORE.includes("import { mergeSampleLoad }"), "thiếu import mergeSampleLoad");
});
ok("store: nhánh specPreserved chỉ set media + ready (không đụng spec/projectId/history)", () => {
  const idx = STORE.indexOf("if (merged.specPreserved)");
  assert.ok(idx >= 0, "thiếu nhánh merged.specPreserved");
  const branch = STORE.slice(idx, idx + 700);
  assert.ok(branch.includes("set({ media: merged.media, ready: true })"), "nhánh giữ spec phải set({ media: merged.media, ready: true })");
  // ready: true là bắt buộc — lượt mẫu đã xong, không thì splash "Đang
  // mở dự án..." đè màn hình mãi (ready khởi đầu false) và WelcomeModal
  // không hiện (chỉ render khi ready). Đã bắt được ở lần headed đầu.
  assert.ok(branch.includes("ready: true"), "nhánh giữ spec thiếu ready: true");
  // Kiểm tra lời GỌI (có dấu "(" liền) — comment giải thích trong
  // nhánh có nhắc tên hàm nên không được so chuỗi trần.
  assert.ok(!branch.includes("markSaved("), "nhánh giữ spec không được gọi markSaved (spec user chưa lưu)");
  assert.ok(!branch.includes("clearHistory("), "nhánh giữ spec không được gọi clearHistory (undo user còn nguyên)");
});
ok("store: nhánh mẫu vẫn markSaved + clearHistory như cũ (spec mẫu mới là đã-lưu)", () => {
  assert.ok(STORE.includes("markSaved(merged.spec);"), "thiếu markSaved(merged.spec)");
  assert.ok(STORE.includes("clearHistory(); // đổi project -> không undo xuyên project"), "thiếu clearHistory nhánh mẫu");
});
ok("store: loadSample không còn set() ghi đè media mẫu trần (set({ spec, media }))", () => {
  // Khoanh đúng hàm loadSample (replaceProject ở dưới vẫn set({ spec, … })
  // là hành vi đúng khi mở file/autosave — không được bắt nhầm).
  const start = STORE.indexOf("loadSample: async () => {");
  const end = STORE.indexOf("newProject: () => {", start);
  assert.ok(start >= 0 && end > start, "không khoanh được hàm loadSample");
  const fn = STORE.slice(start, end);
  assert.ok(fn.includes("spec: merged.spec,"), "loadSample phải set spec: merged.spec");
  assert.ok(!/^\s*spec,$/m.test(fn), "loadSample vẫn còn set({ spec, … }) ghi đè (spec shorthand)");
  assert.ok(!/^\s*media,$/m.test(fn), "loadSample vẫn còn set({ …, media }) ghi đè (media shorthand)");
});

// --- Nối tĩnh: modal Escape ----------------------------------------------
const MODAL = readFileSync("apps/web/src/components/CodecUnsupportedModal.tsx", "utf8");
ok("modal: Escape đóng theo đúng pattern tự chứa SceneModal/WelcomeModal (đợt 58 O1)", () => {
  assert.ok(MODAL.includes('import { useEffect } from "react";'), "thiếu import useEffect");
  assert.ok(MODAL.includes('window.addEventListener("keydown", onKey)'), "thiếu đăng ký keydown");
  assert.ok(MODAL.includes('window.removeEventListener("keydown", onKey)'), "thiếu gỡ keydown lúc unmount");
  assert.ok(MODAL.includes('if (e.key === "Escape") onClose();'), "thiếu nhánh Escape → onClose()");
  assert.ok(
    MODAL.includes('el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT"'),
    "thiếu guard bỏ qua INPUT/TEXTAREA/SELECT như các modal khác",
  );
  assert.ok(!MODAL.includes("không thêm xử lý phím Escape"), "vẫn còn comment cũ nói không thêm Escape");
});

// --- Nối tĩnh: badge timeline --------------------------------------------
const TIMELINE = readFileSync("apps/web/src/Timeline.tsx", "utf8");
ok("timeline: ClipView tra unsupportedCodec + render badge testid timeline-codec-badge", () => {
  assert.ok(TIMELINE.includes('data-testid="timeline-codec-badge"'), "thiếu badge timeline");
  assert.ok(TIMELINE.includes("unsupportedCodec"), "thiếu lookup unsupportedCodec");
  assert.ok(TIMELINE.includes('mediabin.codecBadgeTitle'), "badge timeline phải dùng lại key mediabin.codecBadgeTitle");
  assert.ok(TIMELINE.includes('clip.src.startsWith("asset:")'), "thiếu khớp asset:<id> (clip từ file .vcut)");
  assert.ok(TIMELINE.includes("m.assetId === clip.src.slice"), "thiếu khớp theo assetId");
});
ok("timeline: badge chỉ là dấu hiệu (span, không phải nút) nên không chặn chọn/kéo clip", () => {
  const idx = TIMELINE.indexOf('data-testid="timeline-codec-badge"');
  assert.ok(idx >= 0);
  const line = TIMELINE.slice(Math.max(0, idx - 120), idx);
  assert.ok(line.includes("<span"), "badge phải là <span>, không phải <button>");
  assert.ok(!line.includes("<button"), "badge không được là button (sẽ chặn onPointerDown của clip)");
});

// --- Dict: không thêm key mới --------------------------------------------
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
ok("dict: vi==en (không thêm key mới — badge timeline dùng lại key C6)", () => {
  const VI = flatten(readJson("apps/web/src/i18n/vi.json"));
  const EN = flatten(readJson("apps/web/src/i18n/en.json"));
  assert.equal(VI.size, EN.size, `vi/en lệch số key: vi=${VI.size} en=${EN.size}`);
  assert.ok(VI.has("mediabin.codecBadgeTitle") && EN.has("mediabin.codecBadgeTitle"), "thiếu key dùng lại mediabin.codecBadgeTitle");
});

runAll();
