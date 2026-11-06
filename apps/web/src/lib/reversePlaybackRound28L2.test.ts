// reversePlaybackRound28L2.test.ts — Harness test phát ngược cho clip
// speed ramp và clip nested + luật pacing seek (đợt 28, luồng L2).
// Nợ đợt 27 §3.2: phát ngược cho ramp/nested chưa từng harness-test riêng.
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/reversePlaybackRound28L2.test.ts
// (chạy từ gốc repo). Phần nối vào preview.tsx (syncMedia pacing) chỉ
// kiểm chứng bằng tsc + build + harness trình duyệt (xem
// PHASE9_ROUND28_L2_REVERSE_LIMITS.md).
import assert from "node:assert/strict";
import {
  MAX_STEP_DRAW_LAG_SEC,
  justCompletedSeek,
  reversePlayhead,
  reverseStep,
  shouldIssueStepSeek,
  stepDrawAllowed,
} from "./reversePlayback.ts";
import { rampSourceTimeAt } from "./previewEngine.ts";
import { buildPreviewSpec } from "./nestedPreview.ts";

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
function approx(a: number, b: number, eps: number, msg: string): void {
  assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} !== ${b} (±${eps})`);
}

const FRAME = 1 / 30;
const LINEAR_1_2 = {
  keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 4, v: 2, easing: "linear" },
  ],
};

/**
 * Mô phỏng vòng lặp preview ở chế độ ngược toàn cục: mỗi tick rAF 16ms,
 * playhead bước lùi đúng từng frame qua reverseStep/reversePlayhead
 * (đúng code preview.tsx dùng), target seek tính bằng rampSourceTimeAt
 * (đúng code collectActives dùng). Trả về chuỗi (playhead, source) tại
 * mỗi frame timeline phân biệt.
 */
function simulateGlobalReverse(
  clip: Parameters<typeof rampSourceTimeAt>[0],
  fromT: number,
  toT: number,
): Array<{ t: number; source: number }> {
  const out: Array<{ t: number; source: number }> = [];
  let t = fromT;
  let acc = 0;
  let lastFrame = -1;
  out.push({ t, source: rampSourceTimeAt(clip, t) });
  for (let i = 0; i < 10000 && t > toT + 1e-9; i++) {
    const step = reverseStep(acc, 0.016, FRAME);
    acc = step.accumulated;
    if (step.steps > 0) {
      const r = reversePlayhead(t, step.steps, FRAME);
      t = r.t;
      const frame = Math.round(t * 30);
      if (frame !== lastFrame) {
        lastFrame = frame;
        out.push({ t, source: rampSourceTimeAt(clip, t) });
      }
      if (r.reachedStart) break;
    }
  }
  return out;
}

console.log("== reverse ramp: phát ngược toàn cục qua clip speed ramp ==");
const rampClip = {
  start: 10, duration: 4, in: 0, out: 6,
  speedKeyframes: LINEAR_1_2,
} as never;
ok("ramp: playhead lùi thăm đúng 121 frame, mỗi frame đúng 1 lần (không skip/lặp)", () => {
  const seq = simulateGlobalReverse(rampClip, 14, 10);
  assert.equal(seq.length, 121);
  for (let i = 1; i < seq.length; i++) {
    approx(seq[i - 1].t - seq[i].t, FRAME, 1e-9, `bước frame ${i}`);
  }
  approx(seq[0].t, 14, 1e-9, "bắt đầu");
  approx(seq[seq.length - 1].t, 10, 1e-9, "kết thúc");
});
ok("ramp: source giảm đơn điệu khi playhead lùi, trong biên [0, 6]", () => {
  const seq = simulateGlobalReverse(rampClip, 14, 10);
  approx(seq[0].source, 6, 1e-3, "source tại t=14 (∫₀⁴ (1+t/4) = 6)");
  approx(seq[seq.length - 1].source, 0, 1e-3, "source tại t=10");
  for (let i = 1; i < seq.length; i++) {
    assert.ok(seq[i].source < seq[i - 1].source, `source phải giảm ở bước ${i}`);
    assert.ok(seq[i].source >= -1e-9 && seq[i].source <= 6 + 1e-9, "source trong biên");
  }
});
ok("ramp: bước source theo đúng hình ramp (cuối nhanh gấp ~2 đầu chậm)", () => {
  const seq = simulateGlobalReverse(rampClip, 14, 10);
  const firstDelta = seq[0].source - seq[1].source; // gần t=14, speed ≈ 2
  const lastDelta = seq[seq.length - 2].source - seq[seq.length - 1].source; // gần t=10, speed ≈ 1
  approx(firstDelta, 2 / 30, 1e-3, "bước source gần cuối ramp");
  approx(lastDelta, 1 / 30, 1e-3, "bước source gần đầu ramp");
  assert.ok(firstDelta > 1.5 * lastDelta, "ramp 1→2 phải cho bước cuối > 1.5× bước đầu");
});

console.log("== reverse clip: clip.reverse ở cả 2 chiều playhead ==");
const revClip = {
  start: 0, duration: 6, in: 0, out: 6, speed: 1, reverse: true,
} as never;
ok("clip.reverse + phát xuôi: source giảm 6→0 khi playhead tiến", () => {
  approx(rampSourceTimeAt(revClip, 0), 6, 1e-9, "t=0 → cuối nguồn");
  approx(rampSourceTimeAt(revClip, 6), 0, 1e-9, "t=6 → đầu nguồn");
  let prev = rampSourceTimeAt(revClip, 0);
  for (let f = 1; f <= 180; f++) {
    const s = rampSourceTimeAt(revClip, f / 30);
    assert.ok(s < prev, `source phải giảm ở frame ${f}`);
    prev = s;
  }
});
ok("clip.reverse + phát ngược toàn cục: source tăng 0→6 khi playhead lùi", () => {
  // Mô phỏng ngược: playhead 6→0, target seek = rampSourceTimeAt tại t.
  // (Khử trùng frame do float residue ở t≈0: bước cuối có thể cho t =
  // 3e-15 rồi mới về 0, làm thừa 1 mẫu nếu không khử.)
  const seq: number[] = [];
  let t = 6;
  let acc = 0;
  let lastFrame = Math.round(t * 30);
  seq.push(rampSourceTimeAt(revClip, t));
  for (let i = 0; i < 10000 && t > 0; i++) {
    const step = reverseStep(acc, 0.016, FRAME);
    acc = step.accumulated;
    if (step.steps > 0) {
      const r = reversePlayhead(t, step.steps, FRAME);
      t = r.t;
      const frame = Math.round(t * 30);
      if (frame !== lastFrame) {
        lastFrame = frame;
        seq.push(rampSourceTimeAt(revClip, t));
      }
      if (r.reachedStart) break;
    }
  }
  assert.equal(seq.length, 181);
  approx(seq[0], 0, 1e-9, "playhead 6 → đầu nguồn");
  approx(seq[seq.length - 1], 6, 1e-9, "playhead 0 → cuối nguồn");
  for (let i = 1; i < seq.length; i++) {
    assert.ok(seq[i] > seq[i - 1], `source phải tăng ở bước ${i}`);
  }
});

console.log("== reverse nested: clip nested mang ramp, đã làm phẳng ==");
function nestedRampSpec(): never {
  return {
    version: "0.2.0", meta: { name: "t", width: 1920, height: 1080, fps: 30 },
    tracks: [{
      id: "v", kind: "video",
      clips: [{
        kind: "nested", id: "n1", start: 10, duration: 4, in: 0,
        speedKeyframes: LINEAR_1_2,
        tracks: [{ kind: "video", clips: [{ kind: "video", id: "leaf", start: 0, duration: 6, in: 0, out: 6 }] }],
      }],
    }],
  } as never;
}
ok("nested phẳng: 1 lá trên track __nested-video, ngược đơn điệu + đúng giá trị ramp", () => {
  const flat = buildPreviewSpec(nestedRampSpec());
  const track = flat.tracks.find((tr) => tr.id === "__nested-video");
  assert.ok(track, "phải có track __nested-video sau khi phẳng");
  assert.equal(track.clips.length, 1);
  const leaf = track.clips[0] as unknown as {
    start: number; duration: number; in: number;
  };
  approx(leaf.start, 10, 1e-9, "lá bắt đầu ở 10");
  approx(leaf.duration, 4, 1e-9, "lá dài 4 (theo cửa sổ nested)");
  const seq = simulateGlobalReverse(leaf as never, leaf.start + leaf.duration, leaf.start);
  assert.equal(seq.length, 121);
  approx(seq[0].source, 6, 1e-3, "source cuối cửa sổ");
  approx(seq[seq.length - 1].source, 0, 1e-3, "source đầu cửa sổ");
  for (let i = 1; i < seq.length; i++) {
    assert.ok(seq[i].source < seq[i - 1].source, `source lá phải giảm ở bước ${i}`);
  }
  // Parity với clip ramp thường ở cùng localT: t=12 (localT=2) → 2.5.
  approx(rampSourceTimeAt(leaf as never, 12), 2.5, 1e-3, "lá nested tại t=12 khớp ramp thường");
});

console.log("== cửa sổ vẽ ở tick hoàn tất: justCompletedSeek ==");
ok("tick trước seeking + tick này hết seeking = vừa hoàn tất", () => {
  assert.equal(justCompletedSeek(true, false), true);
});
ok("các tổ hợp khác đều không phải vừa hoàn tất", () => {
  assert.equal(justCompletedSeek(false, false), false);
  assert.equal(justCompletedSeek(false, true), false);
  assert.equal(justCompletedSeek(true, true), false);
});

console.log("== guard nới lỏng: stepDrawAllowed ==");
ok("khớp nửa frame thì vẽ (giữ guard K4), kể cả đang seeking", () => {
  assert.equal(stepDrawAllowed(true, 5, 5 + 0.4 / 30, 30), true);
  assert.equal(stepDrawAllowed(false, 5, 5, 30), true);
});
ok("seek xong + lag <= 2s thì vẽ (frame mới hơn frame giữ cũ)", () => {
  assert.equal(stepDrawAllowed(false, 5, 6.5, 30), true);
  assert.equal(stepDrawAllowed(false, 5, 5 + MAX_STEP_DRAW_LAG_SEC, 30), true);
});
ok("đang seeking mà lệch > nửa frame thì không vẽ", () => {
  assert.equal(stepDrawAllowed(true, 5, 6, 30), false);
});
ok("lag > 2s thì không vẽ (vd mới bật ngược, element còn ở frame cũ xa target)", () => {
  assert.equal(stepDrawAllowed(false, 7.3, 29.5, 30), false);
  assert.equal(stepDrawAllowed(false, 5, 5 + MAX_STEP_DRAW_LAG_SEC + 0.1, 30), false);
});

console.log("== pacing seek: shouldIssueStepSeek ==");
const EPS = 0.5 / 30;
ok("đang seeking thì không phát seek mới (kể cả khi target đã đổi)", () => {
  assert.equal(shouldIssueStepSeek(true, 5, 5.5, EPS), false);
  assert.equal(shouldIssueStepSeek(true, 5, 5, EPS), false);
});
ok("không seeking + lệch > eps thì phát seek", () => {
  assert.equal(shouldIssueStepSeek(false, 5, 5.5, EPS), true);
  assert.equal(shouldIssueStepSeek(false, 5, 5.5, 0), true);
});
ok("không seeking + lệch <= eps thì không seek (đúng biên: bằng eps cũng không)", () => {
  assert.equal(shouldIssueStepSeek(false, 5, 5 + EPS, EPS), false);
  assert.equal(shouldIssueStepSeek(false, 5, 5 + EPS / 2, EPS), false);
});

console.log("== pacing simulator: luật cũ (phát chồng) vs luật mới (chờ seek xong) ==");
interface SimResult { issues: number; supersedes: number; completions: number; }
function simulateSeeks(rule: "old" | "paced", gopFrames: number, ticks: number): SimResult {
  // Element model: 1 seek tốn ceil(framesTừKeyframe / 10) tick để giải mã
  // (10 frame/tick là tốc độ giải mã giả định — chỉ để so sánh tương đối
  // 2 luật trên cùng tham số, không phải số đo phần cứng).
  // Playhead ngược: 1 frame mỗi 2 tick (30fps @ vòng 60Hz). Keyframe gần
  // nhất <= target, GOP = gopFrames (thưa 300, dày 30). Luật cũ phát seek
  // mỗi khi |ct-target| > eps (kể cả khi seeking) → reset quá trình giải
  // mã về từ keyframe; luật mới chỉ phát khi !seeking.
  const FRAME_SEC = 1 / 30;
  let playhead = 30;
  let ct = 30;
  let seeking = false;
  let remaining = 0;
  let pendingTarget = 30;
  let issues = 0;
  let supersedes = 0;
  let completions = 0;
  const keyframeAt = (targetSec: number): number => {
    const f = Math.floor(targetSec * 30);
    return Math.floor(f / gopFrames) * gopFrames / 30;
  };
  for (let tick = 0; tick < ticks; tick++) {
    if (tick % 2 === 0 && tick > 0) playhead -= FRAME_SEC; // bước ngược mỗi 2 tick
    const target = playhead;
    const want = Math.abs(ct - target) > EPS;
    const issue = rule === "old" ? want : shouldIssueStepSeek(seeking, ct, target, EPS);
    if (issue) {
      if (seeking) supersedes++;
      seeking = true;
      pendingTarget = target;
      const distFrames = Math.max(0, Math.round((target - keyframeAt(target)) * 30));
      remaining = Math.max(1, Math.ceil(distFrames / 10));
      issues++;
    }
    if (seeking) {
      remaining--;
      if (remaining <= 0) {
        seeking = false;
        ct = pendingTarget;
        completions++;
      }
    }
  }
  return { issues, supersedes, completions };
}
ok("GOP thưa (g 300): luật cũ đói gần hoàn toàn, luật mới hoàn tất đều, 0 phát chồng", () => {
  const old = simulateSeeks("old", 300, 600);
  // Luật cũ chỉ hoàn tất được vài seek khi target vừa qua keyframe
  // (khoảng giải mã < 1 bước frame); còn lại 578 lần phát chồng reset
  // giải mã về keyframe → đói. Số đo simulator: 588 issue / 10 hoàn tất.
  assert.ok(old.supersedes > 100, "luật cũ phải phát chồng hàng trăm lần");
  assert.ok(old.completions <= 15, `luật cũ chỉ hoàn tất lác đác gần keyframe: ${JSON.stringify(old)}`);
  const paced = simulateSeeks("paced", 300, 600);
  assert.equal(paced.supersedes, 0, "luật mới không được phát chồng");
  assert.ok(paced.completions >= 5 * old.completions, `luật mới phải hoàn tất gấp nhiều lần: ${JSON.stringify(paced)} vs ${JSON.stringify(old)}`);
});
ok("GOP dày (g 30): luật mới vẫn hoàn tất, 0 phát chồng", () => {
  const paced = simulateSeeks("paced", 30, 600);
  assert.equal(paced.supersedes, 0);
  assert.ok(paced.completions > 10, `luật mới trên GOP dày: ${JSON.stringify(paced)}`);
});

console.log(`\nreversePlaybackRound28L2: ${pass} test pass`);
