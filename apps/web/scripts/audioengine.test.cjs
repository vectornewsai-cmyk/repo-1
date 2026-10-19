/**
 * Test cho apps/web/src/lib/audioEngine.ts (chạy bằng Node, không cần browser).
 * Web Audio API được mock bằng FakeAudioContext ghi lại mọi lệnh automation.
 * Được biên dịch & chạy bởi scripts/test-audioengine.sh.
 */
"use strict";

const { computeClipGain, AudioEngine, GAIN_SMOOTHING_TC } = require("./out/apps/web/src/lib/audioEngine.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${label}`);
  } else {
    fail += 1;
    console.error(`  ✗ FAIL: ${label}`);
  }
}
function approx(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

// ---------------------------------------------------------------------------
// Fake Web Audio
// ---------------------------------------------------------------------------
function makeFakeParam() {
  return {
    value: 1,
    calls: [],
    setTargetAtTime(v, startTime, tc) {
      this.calls.push({ v, startTime, tc });
    },
    last() {
      return this.calls[this.calls.length - 1];
    },
  };
}

function makeFakeContext() {
  const gains = [];
  const ctx = {
    currentTime: 0,
    state: "running",
    destination: {},
    _gains: gains,
    _analyserData: null,
    _throwOnSource: false,
    createGain() {
      const param = makeFakeParam();
      const node = {
        gain: param,
        connect() {
          return node;
        },
      };
      gains.push(node);
      return node;
    },
    createAnalyser() {
      const node = {
        fftSize: 2048,
        connect() {
          return node;
        },
        getByteTimeDomainData(arr) {
          // tín hiệu hằng biên độ 0.5 → rms = 0.5, peak = 0.5
          const fill = ctx._analyserData !== null ? ctx._analyserData : 192; // (192-128)/128 = 0.5
          arr.fill(fill);
        },
      };
      ctx._analyser = node;
      return node;
    },
    createMediaElementSource() {
      if (ctx._throwOnSource) throw new Error("already connected");
      return {
        connect() {
          return { connect() {} };
        },
      };
    },
    resume() {
      return Promise.resolve();
    },
    close() {
      return Promise.resolve();
    },
  };
  return ctx;
}

function makeFakeEl() {
  return { volume: 1, muted: false, currentTime: 0, paused: true, playbackRate: 1 };
}

// ---------------------------------------------------------------------------
// 1. computeClipGain — envelope volume/fade (khớp render: volume → afade in → afade out)
// ---------------------------------------------------------------------------
console.log("== computeClipGain ==");
{
  const clip = { volume: 0.8, fadeIn: 1, fadeOut: 1, duration: 4 };
  ok(computeClipGain(clip, 0, false) === 0, "fadeIn bắt đầu từ 0");
  ok(approx(computeClipGain(clip, 0.5, false), 0.4), "giữa fadeIn: 0.8 * 0.5 = 0.4");
  ok(approx(computeClipGain(clip, 1, false), 0.8), "hết fadeIn: volume đầy 0.8");
  ok(approx(computeClipGain(clip, 2, false), 0.8), "giữa clip: 0.8");
  ok(approx(computeClipGain(clip, 3, false), 0.8), "trước fadeOut: 0.8");
  ok(approx(computeClipGain(clip, 3.5, false), 0.4), "giữa fadeOut: 0.8 * 0.5 = 0.4");
  ok(computeClipGain(clip, 4, false) === 0, "cuối clip: 0");
  ok(computeClipGain(clip, 99, false) === 0, "quá duration (đã clamp): 0");
  ok(computeClipGain(clip, 1, true) === 0, "track muted → 0 ở mọi thời điểm");
  ok(computeClipGain(clip, -5, false) === 0, "elapsed âm (đã clamp): 0");

  const noFade = { volume: 0.5, duration: 10 };
  ok(computeClipGain(noFade, 5, false) === 0.5, "không fade: volume hằng 0.5");
  const def = { duration: 10 };
  ok(computeClipGain(def, 5, false) === 1, "mặc định volume = 1");
}

// ---------------------------------------------------------------------------
// 2. volumeKeyframes ghi đè volume tĩnh (ngữ nghĩa keyframes.ts)
// ---------------------------------------------------------------------------
console.log("== volumeKeyframes ==");
{
  const clip = {
    duration: 4,
    volume: 0.8,
    volumeKeyframes: {
      keyframes: [
        { t: 0, v: 0.2, easing: "linear" },
        { t: 2, v: 1.0, easing: "linear" },
      ],
    },
  };
  ok(approx(computeClipGain(clip, 0, false), 0.2), "t=0: keyframe 0.2 GHI ĐÈ volume tĩnh 0.8");
  ok(approx(computeClipGain(clip, 1, false), 0.6), "t=1: nội suy linear 0.6");
  ok(approx(computeClipGain(clip, 2, false), 1.0), "t=2: keyframe 1.0");
  ok(approx(computeClipGain(clip, 3, false), 1.0), "t=3: giữ giá trị keyframe cuối");

  const withFade = { ...clip, fadeIn: 2 };
  ok(approx(computeClipGain(withFade, 1, false), 0.3), "keyframe × fadeIn: 0.6 * 0.5 = 0.3");

  const easeIn = {
    duration: 2,
    volumeKeyframes: {
      keyframes: [
        { t: 0, v: 0, easing: "ease-in" },
        { t: 1, v: 1, easing: "linear" },
      ],
    },
  };
  ok(approx(computeClipGain(easeIn, 0.5, false), 0.25), "ease-in: p=0.5 → 0.25");

  const empty = { duration: 2, volume: 0.7, volumeKeyframes: { keyframes: [] } };
  ok(computeClipGain(empty, 1, false) === 0.7, "keyframes rỗng → dùng volume tĩnh");
}

// ---------------------------------------------------------------------------
// 3. AudioEngine với FakeAudioContext — mô phỏng play 3s
// ---------------------------------------------------------------------------
console.log("== AudioEngine (play 3s, fake context) ==");
{
  const ctx = makeFakeContext();
  let levels = [];
  const engine = new AudioEngine({
    createContext: () => ctx,
    onLevel: (rms, peak) => levels.push({ rms, peak }),
  });

  ok(engine.ensure() === true, "ensure() → true với mock context");
  ok(engine.isReady === true, "isReady sau ensure()");
  // _gains[0] là master gain — node của element được tạo ở update() đầu tiên
  const masterGainCount = ctx._gains.length;
  ok(masterGainCount === 1, "ensure() tạo đúng 1 master gain");

  const el = makeFakeEl();
  const clip = { volume: 0.8, fadeIn: 1, fadeOut: 1, duration: 4 };
  const elGainNode = () => ctx._gains[masterGainCount]; // gain node riêng của element

  // Mô phỏng play 3 giây: mỗi 0.5s gọi update() 1 lần (như vòng lặp preview)
  let threw = false;
  const recorded = [];
  try {
    for (let t = 0; t <= 3.0001; t += 0.5) {
      ctx.currentTime = t;
      const gain = computeClipGain(clip, t, false);
      engine.update([{ el, gain }]);
      recorded.push(elGainNode().gain.last().v);
    }
  } catch (e) {
    threw = true;
    console.error("   throw:", e);
  }
  ok(!threw, "play 3s → không throw");
  const expected = [0, 0.4, 0.8, 0.8, 0.8, 0.8, 0.8];
  ok(
    recorded.length === expected.length &&
      recorded.every((v, i) => approx(v, expected[i])),
    `gain đúng envelope [${recorded.map((v) => v.toFixed(2)).join(", ")}]`
  );
  const node = elGainNode();
  ok(
    node.gain.calls.every((c) => approx(c.tc, GAIN_SMOOTHING_TC)),
    "gain làm mượt bằng setTargetAtTime với hằng số GAIN_SMOOTHING_TC"
  );

  // Mute → gain 0
  ctx.currentTime = 10;
  engine.update([{ el, gain: computeClipGain(clip, 1, true) }]);
  ok(approx(node.gain.last().v, 0), "mute → setTargetAtTime(0)");

  // VU meter: đã nhận callback, rms/peak trong 0..1
  ok(levels.length > 0, `VU meter callback đã chạy (${levels.length} lần)`);
  const lastLevel = levels[levels.length - 1];
  ok(
    lastLevel.rms >= 0 && lastLevel.rms <= 1 && lastLevel.peak >= 0 && lastLevel.peak <= 1,
    `rms/peak trong 0..1 (rms=${lastLevel.rms.toFixed(3)}, peak=${lastLevel.peak.toFixed(3)})`
  );
  ok(approx(lastLevel.rms, 0.5, 0.01), "rms ≈ 0.5 với tín hiệu mock biên độ 0.5");

  // 1 element chỉ tạo 1 GainNode (không tạo lại mỗi frame)
  ok(ctx._gains.length === masterGainCount + 1, "1 element → đúng 1 GainNode riêng (không rò rỉ node mỗi frame)");

  // 2 element khác nhau → 2 GainNode độc lập
  const el2 = makeFakeEl();
  ctx.currentTime = 11;
  engine.update([
    { el, gain: 0.3 },
    { el: el2, gain: 0.9 },
  ]);
  ok(ctx._gains.length === masterGainCount + 2, "2 element → 2 GainNode độc lập");
  ok(approx(ctx._gains[masterGainCount + 1].gain.last().v, 0.9), "gain độc lập theo từng source");

  engine.dispose();
  ok(engine.isReady === false, "dispose() → isReady false");
}

// ---------------------------------------------------------------------------
// 4. Fallback khi không có Web Audio / tạo source node thất bại
// ---------------------------------------------------------------------------
console.log("== fallback ==");
{
  // ensure() thất bại (không có window.AudioContext trong Node, không inject mock)
  const engine = new AudioEngine();
  ok(engine.ensure() === false, "ensure() → false khi không có Web Audio");
  const el = makeFakeEl();
  let threw = false;
  try {
    engine.update([{ el, gain: 0.42 }]);
  } catch {
    threw = true;
  }
  ok(!threw && approx(el.volume, 0.42), "fallback: gán el.volume trực tiếp, không throw");

  // createMediaElementSource ném lỗi (element đã gắn context khác) → fallback
  const ctx2 = makeFakeContext();
  ctx2._throwOnSource = true;
  const engine2 = new AudioEngine({ createContext: () => ctx2 });
  engine2.ensure();
  const el3 = makeFakeEl();
  threw = false;
  try {
    engine2.update([{ el: el3, gain: 0.77 }]);
  } catch {
    threw = true;
  }
  ok(!threw && approx(el3.volume, 0.77), "source node lỗi → fallback el.volume, không throw");
}

// ---------------------------------------------------------------------------
console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
