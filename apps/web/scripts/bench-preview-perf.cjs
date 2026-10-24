/**
 * bench-preview-perf.cjs — Đo hiệu năng previewEngine (Q8, Phase 8).
 * Chạy sau khi tsc biên dịch sang CommonJS (xem bench-preview-perf.sh),
 * giống mẫu test-preview-engine.sh. KHÔNG cần browser/DOM.
 *
 * Đo gì (toàn số thật, không ước lượng):
 *  Run 1 — scrub/repeat: cùng 1 clip (mảng keyframes ổn định) tính visual
 *          ở 30 thời điểm × 300 lần lặp → cache memo phải hit.
 *  Run 2 — baseline tương đương code cũ: mỗi lần lặp dùng clip MỚI
 *          (mảng keyframes mới → memo luôn miss, bằng chi phí tính lại).
 *  Run 3 — playback: 9000 thời điểm KHÁC NHAU, cùng clip → memo gần
 *          như không hit; đo này chứng minh giới hạn trung thực: cache
 *          KHÔNG giúp playback xuôi đều (mỗi frame là thời điểm mới).
 *  Run 4 — mediaByName: build Map 500 item × 6000 lần so với tra cứu
 *          Map đã cache (mô phỏng vòng lặp rAF cũ/mới trong preview.tsx).
 *
 * videoClipVisual + videoElementPlacement được gọi cùng nhau vì đó là
 * cặp tính toán thật của drawVideoClip khi clip có scale/rotation
 * (nội suy lặp scale/rotation/x/y ở cả 2 hàm — đúng chỗ memo gỡ).
 */
"use strict";

const OUT = "/tmp/vcut-test-preview-engine/out";
const pe = require(`${OUT}/apps/web/src/lib/previewEngine.js`);

function makeKfs(n, v0, v1) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push({ t: (i * 10) / (n - 1), v: v0 + ((v1 - v0) * i) / (n - 1), easing: i % 2 ? "ease-in" : "ease-out" });
  }
  return arr;
}

function makeClip() {
  return {
    kind: "video",
    id: "c1",
    src: "clip.mp4",
    start: 0,
    duration: 10,
    in: 0,
    out: 10,
    opacity: 0.9,
    animations: {
      x: { keyframes: makeKfs(50, 0, 1) },
      y: { keyframes: makeKfs(50, 0, 1) },
      opacity: { keyframes: makeKfs(50, 0, 1) },
      scale: { keyframes: makeKfs(50, 0.5, 2) },
      rotation: { keyframes: makeKfs(50, -30, 30) },
    },
    filter: { lut: "vcut-honey-glow", color: { brightness: 10, contrast: 5 } },
    effects: [{ type: "blur", intensity: 0.5 }, { type: "sepia", intensity: 0.3 }],
    chromaKey: { color: "#00ff00", similarity: 0.4, blend: 0.1 },
  };
}

function bench(fn) {
  const t0 = process.hrtime.bigint();
  fn();
  const t1 = process.hrtime.bigint();
  return Number(t1 - t0) / 1e6; // ms
}

const TIMES_30 = Array.from({ length: 30 }, (_, i) => (i * 10) / 30);
const clip = makeClip();

// --- Run 1: repeat, cùng clip (memo hit) ---
pe.resetKeyframeMemoStats();
const ms1 = bench(() => {
  for (let r = 0; r < 300; r++) {
    for (const t of TIMES_30) {
      pe.videoClipVisual(clip, t, 1920, 1080, 1920, 1080);
      pe.videoElementPlacement(clip, t, 1920, 1080, 1920, 1080);
    }
  }
});
const st1 = pe.keyframeMemoStats();
const calls1 = 300 * 30 * 2;

// --- Run 2: clip mới mỗi rep (memo chỉ giúp TRONG cùng 1 frame: ---
// videoElementPlacement dùng lại kết quả videoClipVisual vừa tính) ---
pe.resetKeyframeMemoStats();
const ms2 = bench(() => {
  for (let r = 0; r < 300; r++) {
    const fresh = makeClip();
    for (const t of TIMES_30) {
      pe.videoClipVisual(fresh, t, 1920, 1080, 1920, 1080);
      pe.videoElementPlacement(fresh, t, 1920, 1080, 1920, 1080);
    }
  }
});
const st2 = pe.keyframeMemoStats();

// --- Run 2b: baseline KHÔNG memo: gọi thẳng interpolateKeyframes ---
// 9 lần/frame (5 ở videoClipVisual + 4 ở videoElementPlacement), đúng
// số lần nội suy code cũ thực hiện cho 1 clip SR mỗi frame.
const spec = require(`${OUT}/packages/video-spec/src/index.js`);
const rawKfs = makeClip().animations;
const ms2b = bench(() => {
  for (let r = 0; r < 300; r++) {
    for (const t of TIMES_30) {
      spec.interpolateKeyframes(rawKfs.x.keyframes, t);
      spec.interpolateKeyframes(rawKfs.y.keyframes, t);
      spec.interpolateKeyframes(rawKfs.opacity.keyframes, t);
      spec.interpolateKeyframes(rawKfs.scale.keyframes, t);
      spec.interpolateKeyframes(rawKfs.rotation.keyframes, t);
      spec.interpolateKeyframes(rawKfs.scale.keyframes, t);
      spec.interpolateKeyframes(rawKfs.rotation.keyframes, t);
      spec.interpolateKeyframes(rawKfs.x.keyframes, t);
      spec.interpolateKeyframes(rawKfs.y.keyframes, t);
    }
  }
});

// --- Run 3: playback thật: frame nối tiếp ở 30fps (t = i/30), mỗi ---
// frame là thời điểm mới → memo gần như không hit (giới hạn trung thực:
// cache giúp scrub/pause vẽ lại, KHÔNG giúp playback xuôi đều). ---
pe.resetKeyframeMemoStats();
const ms3 = bench(() => {
  for (let i = 0; i < 9000; i++) {
    const t = i / 30;
    pe.videoClipVisual(clip, t, 1920, 1080, 1920, 1080);
    pe.videoElementPlacement(clip, t, 1920, 1080, 1920, 1080);
  }
});
const st3 = pe.keyframeMemoStats();

// --- Run 4: mediaByName Map build vs cached ---
const items = Array.from({ length: 500 }, (_, i) => ({ name: `clip${i}.mp4` }));
const ms4build = bench(() => {
  for (let r = 0; r < 6000; r++) {
    const m = new Map(items.map((x) => [x.name, x]));
    if (m.size !== 500) throw new Error("map sai");
  }
});
const cached = new Map(items.map((x) => [x.name, x]));
const ms4cache = bench(() => {
  for (let r = 0; r < 6000; r++) {
    if (cached.get("clip499.mp4") === undefined) throw new Error("lookup sai");
  }
});

function fmt(ms, calls) {
  return `${ms.toFixed(1)}ms (${(calls / (ms / 1000)).toFixed(0)} calls/s)`;
}
console.log("== Q8 preview perf bench (Node, pure logic, không DOM) ==");
console.log(`Run 1 scrub/repeat (memo): ${fmt(ms1, calls1)} | hits=${st1.hits} misses=${st1.misses}`);
console.log(`Run 2 clip mới mỗi rep (memo chỉ trong frame): ${fmt(ms2, calls1)} | hits=${st2.hits} misses=${st2.misses}`);
console.log(`Run 2b nội suy thô không memo (81000 lần): ${ms2b.toFixed(1)}ms`);
console.log(`  → speedup repeat vs nội suy thô: ${(ms2b / ms1).toFixed(2)}x`);
console.log(`Run 3 playback 9000 frame 30fps nối tiếp: ${fmt(ms3, 18000)} | hits=${st3.hits} misses=${st3.misses}`);
console.log(`Run 4 mediaByName: build mới mỗi tick ${ms4build.toFixed(1)}ms vs cache lookup ${ms4cache.toFixed(1)}ms (6000 lần, 500 item)`);
console.log(JSON.stringify({
  run1_repeat_ms: +ms1.toFixed(1), run1_hits: st1.hits, run1_misses: st1.misses,
  run2_freshClip_ms: +ms2.toFixed(1),
  run2b_rawInterp_ms: +ms2b.toFixed(1), speedup_repeat_vs_raw: +(ms2b / ms1).toFixed(2),
  run3_playback_ms: +ms3.toFixed(1), run3_hits: st3.hits, run3_misses: st3.misses,
  run4_mapBuild_ms: +ms4build.toFixed(1), run4_mapCached_ms: +ms4cache.toFixed(1),
}));
