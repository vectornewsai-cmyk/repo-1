// twoLevelCurve.test.ts — Phase 9 đợt 20 R1: hợp curve hai tầng phía web.
// Chạy từ gốc repo (alias @repo-1/video-spec resolve qua node_modules):
//   node --experimental-strip-types apps/web/src/lib/twoLevelCurve.test.ts
// Các số kỳ vọng (a) suy tay bằng công thức giải tích, GIỐNG HỆT test
// render server/render/src/test_round20_two_level_render.js — cùng input
// phải cho cùng output trong 1e-6 (đó là kiểm chứng khớp render ↔ web).
// Ngoài linear 1→2 trên D=4: s(t) = 1 + t/4, ∫₀ᵗ = t + t²/8, C = 6.
// Trong linear 1→2 trên duration con 6: s_i(x) = 1 + x/6, ∫₀ˣ = x + x²/12.
//   x(t') = t' + t'²/8; src(t') = x + x²/12.
//   t'=2 → x=2.5, src=3.0208333, c=2.125. t'=4 → x=6, src=9, c=4.
// Trường hợp (b) ease+bezier không có dạng đóng nên chỉ đo sai số mã hoá
// so với hàm hợp ĐÚNG (tích phân) — cùng cách đo như phía render.
import assert from "node:assert/strict";
import {
  composeTwoLevelCurve,
  isConstantSpeedCurve,
  twoLevelTauOffset,
} from "./twoLevelCurve.ts";
import { integrateSpeed, speedAt } from "@repo-1/video-spec";

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
function approx(actual: number, expected: number, eps = 1e-6, what = ""): void {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${what} kỳ vọng ${expected}, nhận ${actual} (sai ${Math.abs(actual - expected)})`,
  );
}
function throws(name: string, fn: () => void, needle?: string): void {
  ok(name, () => {
    let msg = "";
    try {
      fn();
    } catch (e) {
      msg = (e as Error).message;
    }
    assert.ok(msg.length > 0, "kỳ vọng throw nhưng không throw");
    if (needle) assert.ok(msg.includes(needle), `lỗi không chứa "${needle}": ${msg}`);
  });
}

const LINEAR_1_2_4 = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};
const LINEAR_1_2_6 = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 6, v: 2, easing: "linear" },
  ],
};

ok("tau: τ(3) = 2.3246, τ(6) = 4 (linear 1→2)", () => {
  approx(twoLevelTauOffset(LINEAR_1_2_4 as never, 4, 3), 2.324555, 1e-3);
  approx(twoLevelTauOffset(LINEAR_1_2_4 as never, 4, 6), 4, 1e-6);
});

ok("(a) linear x linear: startOffset/duration/in/out khớp render", () => {
  const r = composeTwoLevelCurve({
    outerCurve: LINEAR_1_2_4 as never,
    outerDuration: 4,
    outerIn: 0,
    innerCurve: LINEAR_1_2_6 as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 12,
  });
  approx(r.startOffset, 0);
  approx(r.duration, 4);
  approx(r.in, 0);
  approx(r.out, 9);
});

ok("(a) exact sourceAt/speedAt khớp tính tay trong 1e-6", () => {
  const r = composeTwoLevelCurve({
    outerCurve: LINEAR_1_2_4 as never,
    outerDuration: 4,
    outerIn: 0,
    innerCurve: LINEAR_1_2_6 as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 12,
  });
  approx(r.sourceAt(2), 3.0208333333333335);
  approx(r.sourceAt(4), 9);
  approx(r.speedAt(2), 2.125);
  approx(r.speedAt(0), 1);
  approx(r.speedAt(4), 4);
});

ok("(a) encoded curve khớp hàm hợp đúng trong 1e-6 (Hermite đúng hệt)", () => {
  const r = composeTwoLevelCurve({
    outerCurve: LINEAR_1_2_4 as never,
    outerDuration: 4,
    outerIn: 0,
    innerCurve: LINEAR_1_2_6 as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 12,
  });
  assert.ok(r.speedKeyframes.keyframes.length <= 128);
  let worstS = 0;
  let worstI = 0;
  for (let i = 0; i <= 40; i++) {
    const t = i * 0.1;
    worstS = Math.max(worstS, Math.abs(speedAt(r.speedKeyframes, t) - r.speedAt(t)));
    worstI = Math.max(worstI, Math.abs(integrateSpeed(r.speedKeyframes, 0, t) - r.sourceAt(t)));
  }
  assert.ok(worstS < 1e-6, `sai tốc độ ${worstS}`);
  assert.ok(worstI < 1e-6, `sai tích phân ${worstI}`);
});

ok("(a2) cắt trái: outerIn=1 → startOffset 0, duration 3.4833, in 1.083333", () => {
  const r = composeTwoLevelCurve({
    outerCurve: LINEAR_1_2_4 as never,
    outerDuration: 4,
    outerIn: 1,
    innerCurve: LINEAR_1_2_6 as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 12,
  });
  approx(r.startOffset, 0);
  approx(r.duration, 3.483314, 1e-3);
  approx(r.in, 1.0833333333333333);
  approx(r.out, 9);
});

ok("(b) ease-in x bezier: encoded khớp exact < 1e-3", () => {
  const outer = {
    keyframes: [
      { t: 0, v: 1, easing: "ease-in" },
      { t: 4, v: 2, easing: "ease-in" },
    ],
  };
  const inner = {
    keyframes: [
      { t: 0, v: 1, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
      { t: 6, v: 2, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
    ],
  };
  const r = composeTwoLevelCurve({
    outerCurve: outer as never,
    outerDuration: 4,
    outerIn: 0,
    innerCurve: inner as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 20,
  });
  approx(r.duration, 4);
  assert.ok(r.speedKeyframes.keyframes.length <= 128);
  let worstS = 0;
  let worstI = 0;
  for (let i = 0; i <= 80; i++) {
    const t = r.duration * (i / 80);
    worstS = Math.max(worstS, Math.abs(speedAt(r.speedKeyframes, t) - r.speedAt(t)));
    worstI = Math.max(worstI, Math.abs(integrateSpeed(r.speedKeyframes, 0, t) - r.sourceAt(t)));
  }
  assert.ok(worstS < 1e-3, `sai tốc độ ${worstS}`);
  assert.ok(worstI < 1e-3, `sai tích phân ${worstI}`);
});

ok("(c) trong hằng 1.5 → slice ngoài × 1.5 đúng hệt", () => {
  const r = composeTwoLevelCurve({
    outerCurve: LINEAR_1_2_4 as never,
    outerDuration: 4,
    outerIn: 0,
    innerCurve: {
      keyframes: [
        { t: 0, v: 1.5, easing: "linear" },
        { t: 6, v: 1.5, easing: "linear" },
      ],
    } as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 12,
  });
  assert.strictEqual(r.speedKeyframes.keyframes.length, 2);
  approx(r.speedKeyframes.keyframes[0].v, 1.5, 1e-9);
  approx(r.speedKeyframes.keyframes[1].t, 4, 1e-9);
  approx(r.speedKeyframes.keyframes[1].v, 3, 1e-9);
  approx(r.out, 9, 1e-9);
});

ok("(c) ngoài hằng 2 → slice trong, chia thời gian, nhân v", () => {
  const r = composeTwoLevelCurve({
    outerCurve: {
      keyframes: [
        { t: 0, v: 2, easing: "linear" },
        { t: 4, v: 2, easing: "linear" },
      ],
    } as never,
    outerDuration: 4,
    outerIn: 0,
    innerCurve: LINEAR_1_2_6 as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 20,
  });
  approx(r.duration, 3, 1e-9);
  assert.strictEqual(r.speedKeyframes.keyframes.length, 2);
  approx(r.speedKeyframes.keyframes[0].v, 2, 1e-9);
  approx(r.speedKeyframes.keyframes[1].t, 3, 1e-9);
  approx(r.speedKeyframes.keyframes[1].v, 4, 1e-9);
  approx(r.out, 9, 1e-9);
});

ok("isConstantSpeedCurve: hằng true, không hằng false", () => {
  assert.ok(isConstantSpeedCurve({
    keyframes: [
      { t: 0, v: 2, easing: "linear" },
      { t: 4, v: 2, easing: "bezier", bezier: [0.25, 2, 0.75, -1] },
    ],
  } as never));
  assert.ok(!isConstantSpeedCurve(LINEAR_1_2_4 as never));
});

throws("tốc độ hợp vượt 4 thì throw", () => {
  composeTwoLevelCurve({
    outerCurve: {
      keyframes: [
        { t: 0, v: 2, easing: "linear" },
        { t: 4, v: 3, easing: "linear" },
      ],
    } as never,
    outerDuration: 4,
    outerIn: 0,
    innerCurve: LINEAR_1_2_6 as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 20,
  });
}, "vượt khoảng");

throws("curve trong v vượt khoảng thì throw", () => {
  composeTwoLevelCurve({
    outerCurve: LINEAR_1_2_4 as never,
    outerDuration: 4,
    outerIn: 0,
    innerCurve: {
      keyframes: [
        { t: 0, v: 1, easing: "linear" },
        { t: 6, v: 5, easing: "linear" },
      ],
    } as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 12,
  });
}, "v phải trong");

throws("lá ngoài cửa sổ hoàn toàn thì throw", () => {
  composeTwoLevelCurve({
    outerCurve: LINEAR_1_2_4 as never,
    outerDuration: 4,
    outerIn: 10,
    innerCurve: LINEAR_1_2_6 as never,
    leafStart: 0,
    leafDuration: 6,
    leafIn: 0,
    leafOut: 12,
  });
});

console.log(`${pass} check pass.`);
