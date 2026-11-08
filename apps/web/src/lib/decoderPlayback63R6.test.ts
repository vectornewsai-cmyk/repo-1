// decoderPlayback63R6.test.ts — Phase 9 đợt 63, luồng R6: đóng nợ đợt 62
// §4 mục 6 (LIMITS R6 §5.1-5.3):
//   (1) lỗi decoder TRONG LÚC PHÁT (syncMedia): element error:3 giữa chừng
//       đang phát thì stall/kẹt — sau fix, syncMedia drop element đã lỗi
//       (throttle 1,5 s, ngoại lệ scrub-back drop ngay) để element mới
//       seek lại target và hồi phục khi playhead qua vùng hỏng. Đo headed
//       thật bằng harness riêng (xem LIMITS R6 đợt này); file này khóa
//       logic thuần + wiring.
//   (2) giả định fallback proxy reset `error` về null chưa đo headed:
//       đo bằng sampler rAF trong harness (X1) — ở tầng unit, khóa guard
//       "đang load mới thì chưa kết luận stuck" (networkState === 2).
//   (3) hold cache key theo leaf id + src: 2 instance cùng leaf id +
//       cùng src, khác `in` — dùng chung slot sai; sau fix key theo
//       instance + ánh xạ nguồn (in/speed/reverse).
//
// Chạy từ gốc repo (mẫu R6 — esbuild bundle rồi chạy node):
//   ./node_modules/.bin/esbuild apps/web/src/lib/decoderPlayback63R6.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round63-r6/r63.test.cjs
//   node /tmp/round63-r6/r63.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  playingDecoderErrorStatus,
  playingDecoderRetryDue,
  playingDecoderScrubbedBack,
  PLAYING_DECODER_RECOVERY_THROTTLE_MS,
  NETWORK_STATE_LOADING,
} from "./playingDecoderRecovery63R6";
import { heldFrameCacheKey63R6 } from "./holdCacheKey63R6";
import { previewClipInstanceKey } from "./previewClipKey62R6";

// §A — playingDecoderErrorStatus: phân loại lỗi decoder trong lúc phát.
{
  // Chưa lỗi → healthy (null / undefined).
  assert.equal(playingDecoderErrorStatus({ error: null }), "healthy");
  assert.equal(playingDecoderErrorStatus({}), "healthy");
  assert.equal(playingDecoderErrorStatus({ error: null, networkState: 1 }), "healthy");
  // Lỗi + đang load mới (fallback proxy vừa đổi src) → chưa kết luận.
  assert.equal(
    playingDecoderErrorStatus({ error: { code: 4 }, networkState: NETWORK_STATE_LOADING }),
    "fallback-loading",
  );
  assert.equal(
    playingDecoderErrorStatus({ error: { code: 3 }, networkState: 2 }),
    "fallback-loading",
  );
  // Lỗi + không load nữa → dính (mọi networkState khác 2).
  assert.equal(playingDecoderErrorStatus({ error: { code: 3 }, networkState: 1 }), "stuck");
  assert.equal(playingDecoderErrorStatus({ error: { code: 3 }, networkState: 0 }), "stuck");
  assert.equal(playingDecoderErrorStatus({ error: { code: 3 }, networkState: 3 }), "stuck");
  assert.equal(playingDecoderErrorStatus({ error: { code: 3 } }), "stuck");
  assert.equal(playingDecoderErrorStatus({ error: { code: 4 }, networkState: 1 }), "stuck");
  // Getter error ném → healthy (không phá vòng lặp syncMedia).
  const throwing = {
    get error(): never {
      throw new Error("getter boom");
    },
  };
  assert.equal(playingDecoderErrorStatus(throwing), "healthy");
  // Getter networkState ném → coi như không load → stuck (lỗi là chắc).
  const throwingNs = {
    error: { code: 3 },
    get networkState(): never {
      throw new Error("ns boom");
    },
  };
  assert.equal(playingDecoderErrorStatus(throwingNs), "stuck");
  console.log("§A playingDecoderErrorStatus: 12 case pass");
}

// §B — playingDecoderRetryDue: chặn tốc độ drop 1,5 s / clip.
{
  assert.equal(PLAYING_DECODER_RECOVERY_THROTTLE_MS, 1500);
  // Lần đầu (chưa drop lần nào) luôn được.
  assert.equal(playingDecoderRetryDue(10_000, undefined), true);
  // Trong throttle → chưa được.
  assert.equal(playingDecoderRetryDue(10_000, 9_000), false);
  assert.equal(playingDecoderRetryDue(10_000, 8_501), false);
  // Đúng ngưỡng → được.
  assert.equal(playingDecoderRetryDue(10_000, 8_500), true);
  // Quá ngưỡng → được.
  assert.equal(playingDecoderRetryDue(10_000, 5_000), true);
  // Đồng hồ lùi (now < lastDrop) → chưa được (không drop dồn).
  assert.equal(playingDecoderRetryDue(5_000, 9_000), false);
  // Throttle tùy chỉnh.
  assert.equal(playingDecoderRetryDue(10_000, 9_500, 400), true);
  assert.equal(playingDecoderRetryDue(10_000, 9_500, 600), false);
  console.log("§B playingDecoderRetryDue: 9 case pass");
}

// §B2 — playingDecoderScrubbedBack: scrub-back 1 cú lớn thì bỏ qua throttle.
{
  // Chưa từng lỗi (prevTarget undefined) → không phải scrub-back.
  assert.equal(playingDecoderScrubbedBack(undefined, 2), false);
  // Scrub-back: target lùi > 1 s trong 1 tick (ph 4,3 → ph 2).
  assert.equal(playingDecoderScrubbedBack(4.3, 2), true);
  // Lùi đúng 1 s → không đủ (ngưỡng là > 1, không phải >=).
  assert.equal(playingDecoderScrubbedBack(3, 2), false);
  // Lùi ít (phát ngược ~1 frame/tick) → không phải scrub.
  assert.equal(playingDecoderScrubbedBack(5, 4.97), false);
  // Phát xuôi (target tăng) → không phải scrub-back.
  assert.equal(playingDecoderScrubbedBack(2, 4.3), false);
  // Target đứng yên → không phải scrub.
  assert.equal(playingDecoderScrubbedBack(2, 2), false);
  // Ngưỡng tùy chỉnh.
  assert.equal(playingDecoderScrubbedBack(4.3, 2, 2.5), false);
  assert.equal(playingDecoderScrubbedBack(4.3, 2, 2), true);
  console.log("§B2 playingDecoderScrubbedBack: 8 case pass");
}

// §C — heldFrameCacheKey63R6: key hold cache theo instance + ánh xạ nguồn.
{
  // (3a) 2 instance nested cùng leaf id + cùng src, khác `in` → key khác.
  const leafA = { id: "leaf-1", src: "valid.mp4", in: 0, __vcutInstanceKey: "nA/leaf-1" };
  const leafB = { id: "leaf-1", src: "valid.mp4", in: 5, __vcutInstanceKey: "nB/leaf-1" };
  const keyA = heldFrameCacheKey63R6(leafA);
  const keyB = heldFrameCacheKey63R6(leafB);
  assert.notEqual(keyA, keyB);
  assert.ok(keyA.includes("nA/leaf-1"), keyA);
  assert.ok(keyB.includes("nB/leaf-1"), keyB);
  // Key cũ (leaf id + src) của 2 clip này TRÙNG nhau — đây chính là bug:
  // chứng minh bằng công thức cũ ngay trong test để khóa lý do sửa.
  const oldKey = (c: { id: string; src: string }) => `${c.id}::${c.src}`;
  assert.equal(oldKey(leafA), oldKey(leafB));
  // (3a') cùng leaf id + cùng src + cùng `in`, khác instance → vẫn khác
  // (instance tách nhau ngay cả khi ánh xạ nguồn giống nhau).
  const leafB2 = { id: "leaf-1", src: "valid.mp4", in: 0, __vcutInstanceKey: "nB/leaf-1" };
  assert.notEqual(heldFrameCacheKey63R6(leafA), heldFrameCacheKey63R6(leafB2));
  // (3b) cùng instance đổi `in` → key khác (không dùng lại frame ánh xạ cũ).
  const trimmed = { id: "c1", src: "valid.mp4", in: 5 };
  const untrimmed = { id: "c1", src: "valid.mp4", in: 0 };
  assert.notEqual(heldFrameCacheKey63R6(trimmed), heldFrameCacheKey63R6(untrimmed));
  // Cùng instance đổi speed / reverse → key khác.
  assert.notEqual(
    heldFrameCacheKey63R6({ id: "c1", src: "v.mp4", speed: 2 }),
    heldFrameCacheKey63R6({ id: "c1", src: "v.mp4", speed: 1 }),
  );
  assert.notEqual(
    heldFrameCacheKey63R6({ id: "c1", src: "v.mp4", reverse: true }),
    heldFrameCacheKey63R6({ id: "c1", src: "v.mp4", reverse: false }),
  );
  // Cùng clip đổi src → key khác (key cũ đã có src, giữ nguyên).
  assert.notEqual(
    heldFrameCacheKey63R6({ id: "c1", src: "a.mp4" }),
    heldFrameCacheKey63R6({ id: "c1", src: "b.mp4" }),
  );
  // Cùng clip, cùng ánh xạ → key giống nhau (slot ghi đè như cũ).
  assert.equal(
    heldFrameCacheKey63R6({ id: "c1", src: "v.mp4", in: 2, speed: 1 }),
    heldFrameCacheKey63R6({ id: "c1", src: "v.mp4", in: 2, speed: 1 }),
  );
  // Clip không có dấu instance → fallback đúng clip.id (tương thích ngược).
  assert.equal(previewClipInstanceKey({ id: "c1" }), "c1");
  assert.ok(heldFrameCacheKey63R6({ id: "c1", src: "v.mp4" }).startsWith("c1::v.mp4::"));
  // Mặc định in=0 / speed=1 / rv=0 khi thiếu field.
  assert.equal(
    heldFrameCacheKey63R6({ id: "c1", src: "v.mp4" }),
    "c1::v.mp4::in=0::sp=1::rv=0",
  );
  console.log("§C heldFrameCacheKey63R6: 12 case pass");
}

// §D — wiring: preview.tsx nối đúng 3 điểm sửa của đợt này.
{
  const src = readFileSync("apps/web/src/preview.tsx", "utf8");
  // (1) syncMedia: nhánh playing kiểm tra lỗi decoder + drop có chặn.
  assert.ok(src.includes("playingDecoderErrorStatus(a.el)"), "syncMedia thiếu playingDecoderErrorStatus");
  assert.ok(src.includes("playingDecoderRetryDue("), "syncMedia thiếu playingDecoderRetryDue");
  assert.ok(src.includes("playingDecoderScrubbedBack(prevTarget, a.target)"), "syncMedia thiếu scrub-back bypass");
  assert.ok(src.includes("playingDecoderLastTargetByClipKey"), "syncMedia thiếu map target tick lỗi trước");
  assert.ok(src.includes("isFreshElement"), "syncMedia thiếu seek ngay cho element mới (1c)");
  assert.ok(src.includes("freshSeekDue"), "syncMedia thiếu freshSeekDue");
  assert.ok(src.includes("decoderErrorRecoveredPlaying++"), "syncMedia thiếu đếm decoderErrorRecoveredPlaying");
  assert.ok(src.includes("droppedPlayingEls"), "syncMedia thiếu tập droppedPlayingEls");
  assert.ok(src.includes("liveAudioSources"), "syncMedia thiếu liveAudioSources (lọc element đã drop khỏi engine.update)");
  assert.ok(src.includes("decoderErrorRecoveredPlaying: number"), "PreviewIdleDebug thiếu decoderErrorRecoveredPlaying");
  // Chỉ drop khi playing (không đụng nhánh pause — đường R6 giữ nguyên).
  const syncIdx = src.indexOf("function syncMedia(");
  const pauseBranchIdx = src.indexOf("} else {", syncIdx);
  const errIdx = src.indexOf("playingDecoderErrorStatus(a.el)", syncIdx);
  assert.ok(errIdx > syncIdx && errIdx < pauseBranchIdx, "nhánh lỗi decoder phải nằm trong khối if (playing) của syncMedia");
  // (3) hold cache: cả 2 điểm dùng key mới, không còn heldFrameKey cũ.
  assert.ok(!src.includes("heldFrameKey("), "preview.tsx còn dùng heldFrameKey cũ");
  assert.ok(src.includes("heldFrameCacheKey63R6(clip)"), "drawVideoClip/storeHeldFrame thiếu key mới");
  assert.ok(src.includes("__vcutHeldFrameKeys"), "thiếu hook đo __vcutHeldFrameKeys cho harness");
  // storeHeldFrame nhận clip (để tính key instance + ánh xạ), không còn (clipId, src).
  assert.ok(src.includes("function storeHeldFrame(clip:"), "storeHeldFrame chưa đổi signature nhận clip");
  // media.ts: fallback proxy KHÔNG đổi (chỉ đo headed ở đợt này).
  const mediaSrc = readFileSync("apps/web/src/media.ts", "utf8");
  assert.ok(mediaSrc.includes('el!.dataset.proxyFallback = "1"'), "media.ts fallback proxy bị đổi ngoài phạm vi");
  assert.ok(mediaSrc.includes("el!.src = cur.url;"), "media.ts fallback proxy bị đổi ngoài phạm vi");
  console.log("§D wiring preview.tsx + media.ts: 16 needle pass");
}

console.log("decoderPlayback63R6.test.ts: ALL PASS");
