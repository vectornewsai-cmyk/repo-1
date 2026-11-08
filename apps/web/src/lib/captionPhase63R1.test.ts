// captionPhase63R1.test.ts — Phase 9 đợt 63, luồng R1: localize phase text
// caption theo locale (đóng nợ đợt 62 R10 §10.4 — bridge trả chuỗi vi,
// CaptionModal hiển thị nguyên vẹn nên locale en vẫn thấy tiếng Việt).
//
// Khóa 3 chiều: phase KEY bridge gửi (phaseFromLine / translatePhaseFromLine
// ở server/bridge/src/caption.js + "upload" đầu stream) == tập
// CAPTION_PHASE_KEYS == key `caption.phase.<key>` trong fragment round63-r1
// (vi + en, chuỗi không rỗng, vi khớp chuỗi bridge cũ để hiển thị vi không
// đổi). Fallback: phase lạ / thiếu key → message bridge → processing;
// không bao giờ trả key thô ra UI.
//
// Cách chạy (từ gốc repo; bundle ra scratch ngoài repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/captionPhase63R1.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round63-r1/r1.test.cjs \
//     && node /tmp/round63-r1/r1.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CAPTION_PHASE_KEYS,
  captionPhaseLabel,
  captionPhaseTable,
  resolveCaptionPhaseLabel,
  type CaptionPhaseTable,
} from "./captionPhase63R1";

/** Khai báo tối thiểu để không cần @types/node (mẫu M5). */
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
  console.log(`R1 caption phase locale round 63: ${pass}/${queue.length} pass`);
}

const FRAG_PATH = "apps/web/src/i18n/fragments/round63-r1.json";
const frag = JSON.parse(readFileSync(FRAG_PATH, "utf8")) as {
  vi: { caption: { phase: Record<string, string> } };
  en: { caption: { phase: Record<string, string> } };
};

/** Chuỗi vi bridge gửi kèm trong NDJSON (server/bridge/src/caption.js). */
const BRIDGE_VI: Record<string, string> = {
  upload: "Đã nhận file, chuẩn bị…",
  extract: "Đang trích xuất audio…",
  transcribe: "Đang nhận diện giọng nói (video dài có thể mất vài phút)…",
  translating: "Đang dịch sang tiếng Anh (video dài có thể mất vài phút)…",
  group: "Đang gộp câu phụ đề…",
};

ok("fragment có đủ 5 key phase ở cả vi + en, chuỗi không rỗng", () => {
  assert.deepEqual(Object.keys(frag.vi.caption.phase).sort(), [...CAPTION_PHASE_KEYS].sort());
  assert.deepEqual(Object.keys(frag.en.caption.phase).sort(), [...CAPTION_PHASE_KEYS].sort());
  for (const k of CAPTION_PHASE_KEYS) {
    assert.equal(typeof frag.vi.caption.phase[k], "string");
    assert.ok(frag.vi.caption.phase[k].length > 0, `vi.${k} rỗng`);
    assert.equal(typeof frag.en.caption.phase[k], "string");
    assert.ok(frag.en.caption.phase[k].length > 0, `en.${k} rỗng`);
  }
});

ok("chuỗi vi trong fragment khớp chuỗi bridge cũ (hiển thị vi không đổi)", () => {
  for (const k of CAPTION_PHASE_KEYS) {
    assert.equal(frag.vi.caption.phase[k], BRIDGE_VI[k], `vi.${k}`);
  }
});

ok("chuỗi en khác chuỗi vi (thật sự đã dịch, không copy)", () => {
  for (const k of CAPTION_PHASE_KEYS) {
    assert.notEqual(frag.en.caption.phase[k], frag.vi.caption.phase[k], `en.${k}`);
  }
});

ok("CAPTION_PHASE_KEYS khớp key fragment (không thừa/thiếu)", () => {
  assert.equal(CAPTION_PHASE_KEYS.length, 5);
  for (const k of CAPTION_PHASE_KEYS) {
    assert.ok(k in frag.vi.caption.phase, k);
    assert.ok(k in frag.en.caption.phase, k);
  }
});

ok("resolve: locale en → chuỗi en cho cả 5 phase", () => {
  for (const k of CAPTION_PHASE_KEYS) {
    assert.equal(
      resolveCaptionPhaseLabel(k, BRIDGE_VI[k], "en", "Processing…"),
      frag.en.caption.phase[k],
      k,
    );
  }
});

ok("resolve: locale vi → chuỗi vi cho cả 5 phase", () => {
  for (const k of CAPTION_PHASE_KEYS) {
    assert.equal(
      resolveCaptionPhaseLabel(k, BRIDGE_VI[k], "vi", "Đang xử lý…"),
      frag.vi.caption.phase[k],
      k,
    );
  }
});

ok("resolve: phase lạ → message bridge (không trả key thô)", () => {
  assert.equal(
    resolveCaptionPhaseLabel("scan", "Đang quét…", "en", "Processing…"),
    "Đang quét…",
  );
  assert.equal(
    resolveCaptionPhaseLabel(undefined, "Đang quét…", "en", "Processing…"),
    "Đang quét…",
  );
});

ok("resolve: phase lạ + không có message → fallback processing", () => {
  assert.equal(resolveCaptionPhaseLabel("scan", undefined, "en", "Processing…"), "Processing…");
  assert.equal(resolveCaptionPhaseLabel(undefined, undefined, "vi", "Đang xử lý…"), "Đang xử lý…");
  assert.equal(resolveCaptionPhaseLabel("scan", "   ", "en", "Processing…"), "Processing…");
});

ok("captionPhaseLabel: thiếu key en → fallback vi (quy ước i18n)", () => {
  const table: CaptionPhaseTable = {
    vi: { upload: "Đã nhận file, chuẩn bị…" },
    en: {},
  };
  assert.equal(captionPhaseLabel("upload", "en", table), "Đã nhận file, chuẩn bị…");
  assert.equal(captionPhaseLabel("extract", "en", table), undefined);
});

ok("captionPhaseTable đọc đúng từ fragment import (runtime)", () => {
  const table = captionPhaseTable();
  assert.equal(table.en.translating, frag.en.caption.phase.translating);
  assert.equal(table.vi.group, frag.vi.caption.phase.group);
});

runAll();
