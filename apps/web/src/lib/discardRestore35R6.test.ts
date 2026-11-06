// discardRestore35R6.test.ts — Khóa phân loại khôi phục sau reload
// của đợt 35 R6. Chạy bằng Node type-stripping (không cần browser):
//   node --experimental-strip-types apps/web/src/lib/discardRestore35R6.test.ts
// (chạy từ gốc repo). Hành vi trình duyệt thật do probe
// probe-round35-r6-discard-dpr-pipe.mjs kiểm chứng (xem LIMITS đợt này).
import assert from "node:assert/strict";
import {
  SESSION_STATE_LOST_AFTER_RELOAD,
  classifyClipSrc,
  summarizeRestore,
} from "./discardRestore35R6.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

ok("blob: chết theo document, không vẽ lại được", () => {
  const v = classifyClipSrc("blob:http://127.0.0.1:4196/abc-123");
  assert.equal(v.kind, "blob");
  assert.equal(v.bytesSurviveReload, false);
  assert.equal(v.previewResolvesAfterReload, false);
});

ok("bare-name (mau-1.webm mẫu) mất vì media bin rỗng", () => {
  const v = classifyClipSrc("mau-1.webm");
  assert.equal(v.kind, "bare-name");
  assert.equal(v.bytesSurviveReload, false);
  assert.equal(v.previewResolvesAfterReload, false);
});

ok("asset: bytes sống trong IndexedDB nhưng preview vẫn chưa vẽ lại được", () => {
  const v = classifyClipSrc("asset:a_0123456789abcdef");
  assert.equal(v.kind, "asset");
  assert.equal(v.bytesSurviveReload, true);
  assert.equal(v.previewResolvesAfterReload, false);
});

ok("http sống nếu server còn phục vụ; data: sống cùng spec", () => {
  const h = classifyClipSrc("https://example.com/clip.mp4");
  assert.equal(h.kind, "http");
  assert.equal(h.previewResolvesAfterReload, true);
  const d = classifyClipSrc("data:video/webm;base64,AAAA");
  assert.equal(d.kind, "data");
  assert.equal(d.previewResolvesAfterReload, true);
});

ok("spec mẫu: 2 clip bare-name mất, 1 clip text sống, allMediaLost=true", () => {
  const spec = {
    tracks: [
      {
        clips: [
          { kind: "video", src: "mau-1.webm" },
          { kind: "video", src: "mau-2.webm" },
        ],
      },
      { clips: [{ kind: "text", text: "Xin chào! Đây là VCut Studio" }] },
    ],
  };
  const s = summarizeRestore(spec);
  assert.equal(s.mediaClips, 2);
  assert.equal(s.textClips, 1);
  assert.deepEqual(s.unresolvableSrcs, ["mau-1.webm", "mau-2.webm"]);
  assert.equal(s.byKind["bare-name"], 2);
  assert.equal(s.allMediaLost, true);
});

ok("media đã relink/import lại thì không còn mất", () => {
  const spec = {
    tracks: [{ clips: [{ kind: "video", src: "mau-1.webm" }] }],
  };
  const s = summarizeRestore(spec, new Set(["mau-1.webm"]));
  assert.equal(s.unresolvableSrcs.length, 0);
  assert.equal(s.allMediaLost, false);
});

ok("2 clip cùng 1 src: đếm clip đúng, src distinct không nhân đôi", () => {
  const spec = {
    tracks: [{ clips: [
      { kind: "video", src: "mau-1.webm" },
      { kind: "video", src: "mau-1.webm" },
    ] }],
  };
  const s = summarizeRestore(spec);
  assert.equal(s.mediaClips, 2);
  assert.equal(s.unresolvableAfterReload, 1);
  assert.equal(s.allMediaLost, true);
});

ok("trạng thái phiên mất: đủ 7 mục, gồm playhead/playing/reverse/mediaBin", () => {
  const keys = SESSION_STATE_LOST_AFTER_RELOAD.map((x) => x.key);
  for (const k of ["playhead", "playing", "reversePlayback", "mediaBin",
    "reverseFrameCache", "holdFrame", "decodeState"]) {
    assert.ok(keys.includes(k), `thiếu ${k}`);
  }
  assert.equal(keys.length, 7);
});

console.log(`discardRestore35R6: ${pass} test đã chạy (xem exit code).`);
