// playheadHold90R2.test.ts — Phase 9 đợt 90, luồng R2: khóa quyết định
// đóng băng playhead trong lúc phát sau seek (xem playheadHold90R2.ts).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/playheadHold90R2.test.ts
// (chạy từ gốc repo).
import assert from "node:assert/strict";
import {
  PLAYHEAD_HOLD_MAX_MS,
  PLAYHEAD_RESUME_STALL_GRACE_MS,
  PLAYHEAD_RESUME_STALL_MAX_MS,
  initialPlayheadHoldState,
  shouldHoldForResumeStall,
  shouldHoldPlayheadWhileSeeking,
  type PlayheadHoldState,
  type PlayheadResumeWatch,
} from "./playheadHold90R2.ts";

let pass = 0;
async function ok(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e instanceof Error ? e.stack : e}`);
    process.exitCode = 1;
  }
}

function decide(playing: boolean, seeking: boolean, nowMs: number, state: PlayheadHoldState) {
  return shouldHoldPlayheadWhileSeeking({ playing, seekingPrevTick: seeking, nowMs, state });
}

await ok("không giữ khi không phát (dù đang seeking — scrub lúc pause không đụng)", () => {
  const d = decide(false, true, 1000, initialPlayheadHoldState());
  assert.equal(d.hold, false);
  assert.deepEqual(d.state, { holdingSinceMs: null, capReleased: false });
});

await ok("không giữ khi đang phát mà không seeking (phát thường không chậm lại)", () => {
  const d = decide(true, false, 1000, initialPlayheadHoldState());
  assert.equal(d.hold, false);
  assert.deepEqual(d.state, { holdingSinceMs: null, capReleased: false });
});

await ok("giữ ngay tick đầu tiên thấy seeking, ghi mốc nowMs", () => {
  const d = decide(true, true, 5000, initialPlayheadHoldState());
  assert.equal(d.hold, true);
  assert.deepEqual(d.state, { holdingSinceMs: 5000, capReleased: false });
});

await ok("giữ liên tục trong trần (14,9s sau mốc vẫn giữ, mốc không đổi)", () => {
  let s = decide(true, true, 1000, initialPlayheadHoldState()).state;
  const d = decide(true, true, 1000 + PLAYHEAD_HOLD_MAX_MS - 100, s);
  assert.equal(d.hold, true);
  assert.equal(d.state.holdingSinceMs, 1000);
  assert.equal(d.state.capReleased, false);
});

await ok("vượt trần 15s thì nhả + latch capReleased (seek kẹt không đóng băng mãi)", () => {
  let s = decide(true, true, 1000, initialPlayheadHoldState()).state;
  const d = decide(true, true, 1000 + PLAYHEAD_HOLD_MAX_MS + 1, s);
  assert.equal(d.hold, false);
  assert.equal(d.state.capReleased, true);
  assert.equal(d.state.holdingSinceMs, 1000);
});

await ok("đúng biên trần (== 15s) vẫn giữ — chỉ vượt mới nhả", () => {
  let s = decide(true, true, 1000, initialPlayheadHoldState()).state;
  const d = decide(true, true, 1000 + PLAYHEAD_HOLD_MAX_MS, s);
  assert.equal(d.hold, true);
});

await ok("sau khi nhả vì trần, seeking còn bay vẫn KHÔNG giữ lại (latch)", () => {
  let s = decide(true, true, 1000, initialPlayheadHoldState()).state;
  s = decide(true, true, 1000 + PLAYHEAD_HOLD_MAX_MS + 1, s).state;
  assert.equal(s.capReleased, true);
  const d = decide(true, true, 1000 + PLAYHEAD_HOLD_MAX_MS + 5000, s);
  assert.equal(d.hold, false);
  assert.equal(d.state.capReleased, true);
});

await ok("seeking về false thì reset latch — seek MỚI giữ lại được từ đầu", () => {
  let s = decide(true, true, 1000, initialPlayheadHoldState()).state;
  s = decide(true, true, 1000 + PLAYHEAD_HOLD_MAX_MS + 1, s).state;
  assert.equal(s.capReleased, true);
  const reset = decide(true, false, 20000, s);
  assert.equal(reset.hold, false);
  assert.deepEqual(reset.state, { holdingSinceMs: null, capReleased: false });
  const d = decide(true, true, 21000, reset.state);
  assert.equal(d.hold, true);
  assert.equal(d.state.holdingSinceMs, 21000);
});

await ok("dừng phát giữa lúc giữ thì reset (phát lại sau đó là lần giữ mới)", () => {
  let s = decide(true, true, 1000, initialPlayheadHoldState()).state;
  const d = decide(false, true, 2000, s);
  assert.equal(d.hold, false);
  assert.deepEqual(d.state, { holdingSinceMs: null, capReleased: false });
});

await ok("nowMs lùi (đồng hồ rAF bất thường) không nhả oan — hiệu âm < trần", () => {
  let s = decide(true, true, 5000, initialPlayheadHoldState()).state;
  const d = decide(true, true, 4000, s);
  assert.equal(d.hold, true);
});

await ok("cạnh lên nút Phát giữ ngay cả khi tick trước chưa seeking (không vượt dt tick đầu)", () => {
  // Đợt 90 R2 (a2): webkit-load đo playhead nhảy 0,5 → 0,667 = 5 frame
  // trong đúng tick bấm play (rAF đầu sau wake() tới muộn ~170ms) vì giữ
  // chỉ kích từ tick sau qua cờ N3.
  const d = shouldHoldPlayheadWhileSeeking({ playing: true, seekingPrevTick: false, forceSeekEdge: true, nowMs: 1000, state: initialPlayheadHoldState() });
  assert.equal(d.hold, true);
  assert.equal(d.state.holdingSinceMs, 1000);
});

await ok("cạnh lên nút Phát mà forceSeek là no-op thì tick sau nhả ngay (không seeking)", () => {
  let s = shouldHoldPlayheadWhileSeeking({ playing: true, seekingPrevTick: false, forceSeekEdge: true, nowMs: 1000, state: initialPlayheadHoldState() }).state;
  const d = shouldHoldPlayheadWhileSeeking({ playing: true, seekingPrevTick: false, nowMs: 1016, state: s });
  assert.equal(d.hold, false);
  assert.deepEqual(d.state, { holdingSinceMs: null, capReleased: false });
});

await ok("cạnh lên nút Phát khi đang pause thì không giữ (playing=false)", () => {
  const d = shouldHoldPlayheadWhileSeeking({ playing: false, seekingPrevTick: false, forceSeekEdge: true, nowMs: 1000, state: initialPlayheadHoldState() });
  assert.equal(d.hold, false);
});

await ok("PLAYHEAD_HOLD_MAX_MS = 15000 (pin: trên mọi seek đo Q5 max 9,7s; đổi số phải có ý thức)", () => {
  assert.equal(PLAYHEAD_HOLD_MAX_MS, 15000);
});

// ---- Đợt 91 S2: giữ playhead vì resume-stall sau seek ----

function resumeStall(playing: boolean, nowMs: number, watch: PlayheadResumeWatch | null, currentCt: number, frameDur = 1 / 30) {
  return shouldHoldForResumeStall({ playing, nowMs, watch, currentCt, frameDur });
}

const WATCH: PlayheadResumeWatch = { ctAtCompletion: 1.267, completedAtMs: 5000 };

await ok("S2-R1 không giữ khi không phát (dù watch đang mở)", () => {
  assert.equal(resumeStall(false, 5100, WATCH, 1.267), false);
});

await ok("S2-R2 không giữ khi không có watch (seek chưa hoàn tất lần nào)", () => {
  assert.equal(resumeStall(true, 5100, null, 1.267), false);
});

await ok("S2-R3 giữ khi element đứng yên sau seek xong (currentTime không đổi, trong ân hạn)", () => {
  assert.equal(resumeStall(true, 5100, WATCH, 1.267), true);
});

await ok("S2-R4 giữ khi currentTime chỉ nhích < 1 frame (jitter, decoder chưa resume)", () => {
  assert.equal(resumeStall(true, 5500, WATCH, 1.267 + 0.5 / 30), true);
});

await ok("S2-R5 nhả ngay khi currentTime tăng đúng 1 frame (decoder đã resume)", () => {
  assert.equal(resumeStall(true, 5100, WATCH, 1.267 + 1 / 30), false);
});

await ok("S2-R6 nhả khi currentTime tăng hơn 1 frame (phát bình thường, không chậm lại)", () => {
  assert.equal(resumeStall(true, 5200, WATCH, 1.5), false);
});

await ok("S2-R7 nhả khi currentTime lùi >= 1 frame (seek mới đã đáp ở target khác)", () => {
  assert.equal(resumeStall(true, 5100, WATCH, 1.267 - 1 / 30), false);
});

await ok("S2-R8 (đợt 92 T3 — ĐỔI ngữ nghĩa) quá ân hạn 1500ms mà element vẫn đứng yên thì VẪN GIỮ (tới trần cứng 5000ms); chỉ quá trần cứng mới nhả", () => {
  assert.equal(resumeStall(true, 5000 + PLAYHEAD_RESUME_STALL_GRACE_MS + 1, WATCH, 1.267), true);
  assert.equal(resumeStall(true, 5000 + PLAYHEAD_RESUME_STALL_MAX_MS + 1, WATCH, 1.267), false);
});

await ok("S2-R9 đúng biên ân hạn (== 1500ms) vẫn giữ — chỉ vượt mới nhả", () => {
  assert.equal(resumeStall(true, 5000 + PLAYHEAD_RESUME_STALL_GRACE_MS, WATCH, 1.267), true);
});

await ok("S2-R10 frameDur theo fps project (60fps: nhích 1/60 đã nhả, nhích 1/120 vẫn giữ)", () => {
  assert.equal(resumeStall(true, 5100, WATCH, 1.267 + 1 / 60, 1 / 60), false);
  assert.equal(resumeStall(true, 5100, WATCH, 1.267 + 1 / 120, 1 / 60), true);
});

await ok("S2-R11 PLAYHEAD_RESUME_STALL_GRACE_MS = 1500 (pin: trên mọi stall đo lượt yên 815/1025/920ms; đổi số phải có ý thức)", () => {
  assert.equal(PLAYHEAD_RESUME_STALL_GRACE_MS, 1500);
});

// ---- Đợt 92 T3: giữ-while-frozen tới trần cứng 5000ms (stall > 1500ms) ----

await ok("T3-R1 giữ khi stall 2109ms (GOP 250, tải) — element vẫn đứng yên, chưa tới trần cứng", () => {
  assert.equal(resumeStall(true, 5000 + 2109, WATCH, 1.267), true);
});

await ok("T3-R2 giữ khi stall 2829ms (GOP 30, tải — stall dài nhất đo được) — element vẫn đứng yên", () => {
  assert.equal(resumeStall(true, 5000 + 2829, WATCH, 1.267), true);
});

await ok("T3-R3 đúng biên trần cứng (== 5000ms) vẫn giữ — chỉ vượt mới nhả", () => {
  assert.equal(resumeStall(true, 5000 + PLAYHEAD_RESUME_STALL_MAX_MS, WATCH, 1.267), true);
});

await ok("T3-R4 quá trần cứng 5000ms thì nhả dù element vẫn đứng yên (decoder kẹt thật → drift re-seek cũ lo)", () => {
  assert.equal(resumeStall(true, 5000 + PLAYHEAD_RESUME_STALL_MAX_MS + 1, WATCH, 1.267), false);
});

await ok("T3-R5 nhả ngay khi decoder resume ở 2500ms (burst +0,5s, tốc độ 0,2×) — không chờ tới trần cứng; Đợt 98 Z3: 1 frame lẻ sau 2500ms là tăng BÒ (0,013×) nên VẪN GIỮ, xem Z3-R5", () => {
  assert.equal(resumeStall(true, 5000 + 2500, WATCH, 1.267 + 0.5), false);
});

await ok("T3-R6 PLAYHEAD_RESUME_STALL_MAX_MS = 5000 (pin: trên mọi stall đo đợt 92 T3 tối đa 2829ms; đổi số phải có ý thức)", () => {
  assert.equal(PLAYHEAD_RESUME_STALL_MAX_MS, 5000);
});

// ---- Đợt 94 V2: re-arm trần stall cho stall thứ 2+ (nợ U3 §5) ----

import {
  PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS,
  nextResumeFreezeRearm,
  type ResumeFreezeTrack,
} from "./playheadHold90R2.ts";

function rearm(
  nowMs: number,
  currentCt: number,
  track: ResumeFreezeTrack | null,
  opts: Partial<{ seeking: boolean; paused: boolean; hasWatch: boolean; playing: boolean }> = {},
  frameDur = 1 / 30,
) {
  return nextResumeFreezeRearm({
    playing: opts.playing ?? true,
    nowMs,
    currentCt,
    frameDur,
    seeking: opts.seeking ?? false,
    paused: opts.paused ?? false,
    hasWatch: opts.hasWatch ?? false,
    track,
  });
}

await ok("V2-R1 chưa theo dõi thì bắt đầu theo dõi từ ct/mốc hiện tại, chưa arm", () => {
  const r = rearm(1000, 2.5, null);
  assert.equal(r.arm, null);
  assert.deepEqual(r.track, { lastCt: 2.5, lastAdvanceMs: 1000, ceilingSpent: false });
});

await ok("V2-R2 tăng >= 1 frame Ở TỐC ĐỘ LÀNH (1 frame / 100ms = 0,333×) thì cập nhật mốc tăng cuối, xóa ceilingSpent, không arm; Đợt 98 Z3: 1 frame / 1000ms cũ (0,033×) nay là tăng BÒ — không reset mốc, xem Z3-R1", () => {
  const spent: ResumeFreezeTrack = { lastCt: 2.5, lastAdvanceMs: 1000, ceilingSpent: true };
  const r = rearm(1100, 2.5 + 1 / 30, spent);
  assert.equal(r.arm, null);
  assert.deepEqual(r.track, { lastCt: 2.5 + 1 / 30, lastAdvanceMs: 1100, ceilingSpent: false });
});

await ok("V2-R3 đóng băng < 300ms thì chưa arm (chờ đủ ngưỡng stall)", () => {
  const t: ResumeFreezeTrack = { lastCt: 2.5, lastAdvanceMs: 1000, ceilingSpent: false };
  const r = rearm(1000 + 299, 2.5, t);
  assert.equal(r.arm, null);
  assert.equal(r.track, t);
});

await ok("V2-R4 đóng băng đủ 300ms, chưa có watch → arm watch mới, mốc hoàn tất = lần tăng cuối (đầu stall)", () => {
  const t: ResumeFreezeTrack = { lastCt: 2.5, lastAdvanceMs: 1000, ceilingSpent: false };
  const r = rearm(1000 + 300, 2.5, t);
  assert.deepEqual(r.arm, { ctAtCompletion: 2.5, completedAtMs: 1000 });
  assert.equal(r.track, t);
});

await ok("V2-R5 đóng băng đủ 300ms nhưng đã có watch → không arm trùng", () => {
  const t: ResumeFreezeTrack = { lastCt: 2.5, lastAdvanceMs: 1000, ceilingSpent: false };
  const r = rearm(1000 + 900, 2.5, t, { hasWatch: true });
  assert.equal(r.arm, null);
});

await ok("V2-R6 đã chạm trần đợt này (ceilingSpent) thì không arm lại dù đóng băng lâu; tăng lại Ở TỐC ĐỘ LÀNH thì reset cờ; Đợt 98 Z3: tăng lại ở tốc độ bò thì KHÔNG reset cờ (vẫn là cùng đợt đóng băng)", () => {
  const t: ResumeFreezeTrack = { lastCt: 2.5, lastAdvanceMs: 1000, ceilingSpent: true };
  const r1 = rearm(1000 + 4000, 2.5, t);
  assert.equal(r1.arm, null);
  assert.equal(r1.track?.ceilingSpent, true);
  // Tăng lại ở tốc độ bò (2 frame / 4100ms = 0,016×): vẫn là cùng đợt
  // đóng băng — cờ trần KHÔNG reset, không arm lại.
  const r2 = rearm(1000 + 4100, 2.5 + 2 / 30, r1.track);
  assert.equal(r2.arm, null);
  assert.equal(r2.track?.ceilingSpent, true);
  assert.equal(r2.track?.lastAdvanceMs, 1000);
  // Tăng lại ở tốc độ lành (2 frame / 100ms = 0,667×): decoder resume
  // thật — cờ trần reset.
  const t2: ResumeFreezeTrack = { lastCt: 2.5, lastAdvanceMs: 5000, ceilingSpent: true };
  const r3 = rearm(5100, 2.5 + 2 / 30, t2);
  assert.equal(r3.arm, null);
  assert.equal(r3.track?.ceilingSpent, false);
  assert.equal(r3.track?.lastAdvanceMs, 5100);
});

await ok("V2-R7 seeking/paused/không phát thì dừng theo dõi (track null), không arm", () => {
  const t: ResumeFreezeTrack = { lastCt: 2.5, lastAdvanceMs: 1000, ceilingSpent: false };
  assert.deepEqual(rearm(2000, 2.5, t, { seeking: true }), { track: null, arm: null });
  assert.deepEqual(rearm(2000, 2.5, t, { paused: true }), { track: null, arm: null });
  assert.deepEqual(rearm(2000, 2.5, t, { playing: false }), { track: null, arm: null });
});

await ok("V2-R8 watch arm lại giữ ngay qua shouldHoldForResumeStall (stall 2 dài 603ms như GOP 250 r1 pre-fix)", () => {
  const t: ResumeFreezeTrack = { lastCt: 0.563, lastAdvanceMs: 4873, ceilingSpent: false };
  const r = rearm(4873 + 300, 0.563, t);
  assert.notEqual(r.arm, null);
  // Giữ trong suốt stall 2 (tới 5476ms, chưa tới trần 5000ms từ 4873).
  assert.equal(resumeStall(true, 5476, r.arm, 0.563), true);
  // Quá trần 5000ms từ đầu stall thì nhả (trần tính từ lúc đóng băng bắt đầu).
  assert.equal(resumeStall(true, 4873 + 5001, r.arm, 0.563), false);
});

await ok("V2-R9 tăng chậm tích lũy (< 1 frame mỗi tick, đủ 1 frame sau 2 tick) thì cập nhật mốc, không arm oan", () => {
  let tr: ResumeFreezeTrack | null = null;
  tr = rearm(1000, 2.5, tr).track;
  const r1 = rearm(1100, 2.5 + 1 / 60, tr);
  assert.equal(r1.arm, null);
  assert.equal(r1.track?.lastAdvanceMs, 1000); // chưa đủ 1 frame: mốc chưa đổi
  const r2 = rearm(1200, 2.5 + 1 / 30, r1.track);
  assert.equal(r2.arm, null);
  assert.equal(r2.track?.lastAdvanceMs, 1200); // đủ 1 frame tích lũy: mốc đổi
});

await ok("V2-R10 PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS = 300 (pin: bằng định nghĩa stall của probe, dưới ngưỡng drift 0,35s; đổi số phải có ý thức)", () => {
  assert.equal(PLAYHEAD_RESUME_STALL_REARM_FREEZE_MS, 300);
});

// ---- Đợt 96 X4: tập element có watch resume-stall còn sống ----

import { liveResumeWatchElements } from "./playheadHold90R2.ts";

await ok("X4-R1 không có watch nào → tập rỗng", () => {
  assert.deepEqual([...liveResumeWatchElements([])], []);
});

await ok("X4-R2 watch còn sống → tập chứa đúng element đó (dùng làm grace cho drift re-seek)", () => {
  const elA = {};
  const elB = {};
  const s = liveResumeWatchElements([
    { el: elA, watch: { ctAtCompletion: 2.5, completedAtMs: 1000 } },
    { el: elB, watch: { ctAtCompletion: 3.0, completedAtMs: 2000 } },
  ]);
  assert.equal(s.size, 2);
  assert.equal(s.has(elA), true);
  assert.equal(s.has(elB), true);
  assert.equal(s.has({}), false);
});

await ok("X4-R3 cùng element có 2 watch (không xảy ra ngoài đời) chỉ đếm 1 lần — Set khử trùng", () => {
  const elA = {};
  const s = liveResumeWatchElements([
    { el: elA, watch: { ctAtCompletion: 2.5, completedAtMs: 1000 } },
    { el: elA, watch: { ctAtCompletion: 2.5, completedAtMs: 1500 } },
  ]);
  assert.equal(s.size, 1);
  assert.equal(s.has(elA), true);
});

// ---- Đợt 97 Y4: đuôi ân hạn drift re-seek sau khi watch hết vì element tăng ----

import {
  PLAYHEAD_RESUME_STALL_GRACE_TAIL_MAX_MS,
  nextResumeGraceTail97Y4,
  type ResumeGraceTail97Y4,
} from "./playheadHold90R2.ts";

function tailStep(
  nowMs: number,
  currentCt: number,
  tail: ResumeGraceTail97Y4,
  hasWatch = false,
  playing = true,
) {
  return nextResumeGraceTail97Y4({
    playing,
    nowMs,
    currentCt,
    frameDur: 1 / 30,
    hasWatch,
    tail,
  });
}

await ok("Y4-R1 PLAYHEAD_RESUME_STALL_GRACE_TAIL_MAX_MS = 5000 (pin: cùng trần với watch; đổi số phải có ý thức)", () => {
  assert.equal(PLAYHEAD_RESUME_STALL_GRACE_TAIL_MAX_MS, 5000);
});

await ok("Y4-R2 replay c1: burst 1 tick rồi đóng băng lại — đuôi VẪN MỞ qua đúng tick seek từng bắn (t=3970), đóng khi watch mới arm (t=4170)", () => {
  // c1 đợt 96: watch hết t=3372 (ct 1,4); burst t=3770 ct 1,9823 rồi
  // đóng băng; drift re-seek cũ bắn ~t=3970 (trước khi watch mới arm
  // t≈4170). Đuôi mở ở 3372 phải còn sống ở 3970 để chặn seek đó.
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 3372, advances: 0, lastCt: 1.4 };
  const s1 = tailStep(3770, 1.9823, tail0);
  assert.notEqual(s1.tail, null); // burst: đếm 1 lần tăng, đuôi vẫn mở
  assert.equal(s1.tail?.advances, 1);
  assert.equal(s1.tail?.lastCt, 1.9823);
  const s2 = tailStep(3970, 1.9823, s1.tail!);
  assert.notEqual(s2.tail, null); // tick seek từng bắn: đuôi còn sống → grace chặn
  assert.equal(s2.tail?.advances, 1);
  const s3 = tailStep(4170, 1.9823, s2.tail!, true);
  assert.equal(s3.tail, null); // watch mới arm: tập live X4 tiếp quản
});

await ok("Y4-R3 tăng >= 1 frame ở 2 tick riêng biệt → decoder resume ổn định, đuôi đóng (không chặn seek oan sau đó)", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 1000, advances: 0, lastCt: 1.0 };
  const s1 = tailStep(1100, 1.0 + 1 / 30, tail0);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 1);
  const s2 = tailStep(1200, 1.0 + 2 / 30, s1.tail!);
  assert.equal(s2.tail, null); // lần tăng thứ 2 → đóng
});

await ok("Y4-R4 tăng chậm tích lũy (< 1 frame mỗi tick) không đếm oan: đủ 1 frame tích lũy mới tính 1 lần tăng", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 1000, advances: 0, lastCt: 2.5 };
  const s1 = tailStep(1100, 2.5 + 1 / 60, tail0);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 0); // chưa đủ 1 frame: chưa đếm
  const s2 = tailStep(1200, 2.5 + 1 / 30, s1.tail!);
  assert.notEqual(s2.tail, null);
  assert.equal(s2.tail?.advances, 1); // đủ 1 frame tích lũy: đếm 1
  assert.equal(s2.tail?.lastCt, 2.5 + 1 / 30);
});

await ok("Y4-R5 quá trần 5000 ms kể từ lúc watch hết mà element vẫn đóng băng → đuôi đóng (van an toàn, không chặn seek mãi)", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 1000, advances: 0, lastCt: 1.0 };
  const s1 = tailStep(1000 + 5000, 1.0, tail0);
  assert.notEqual(s1.tail, null); // đúng mốc trần: còn mở (trần là >)
  const s2 = tailStep(1000 + 5001, 1.0, s1.tail!);
  assert.equal(s2.tail, null);
});

await ok("Y4-R6 không phát → đuôi đóng ngay (dừng phát thì không cần grace)", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 1000, advances: 0, lastCt: 1.0 };
  const s = tailStep(1100, 1.0, tail0, false, false);
  assert.equal(s.tail, null);
});

// ---- Đợt 98 Z3: định nghĩa đóng băng theo TỐC ĐỘ (nợ LIMITS đợt 97 §4 mục 3) ----

import {
  PLAYHEAD_RESUME_STALL_CRAWL_RATE_MAX,
  isResumeCrawlAdvance98Z3,
} from "./playheadHold90R2.ts";

await ok("Z3-R1 PLAYHEAD_RESUME_STALL_CRAWL_RATE_MAX = 0,1 (pin: dạng vận tốc của định nghĩa stall 300ms — 1 frame/300ms ≈ 0,111×; trên tốc độ bò đã đo 0,055×, dưới tích lũy chậm lành 0,167×; đổi số phải có ý thức)", () => {
  assert.equal(PLAYHEAD_RESUME_STALL_CRAWL_RATE_MAX, 0.1);
});

await ok("Z3-R2 isResumeCrawlAdvance98Z3: biên đúng 0,1× không phải bò; dưới 0,1× là bò; elapsed 0 thì không đo được tốc độ → coi là tăng thật", () => {
  assert.equal(isResumeCrawlAdvance98Z3(1 / 30, 333), false); // đúng 0,100×: lành
  assert.equal(isResumeCrawlAdvance98Z3(1 / 30, 334), true); // 0,0997×: bò
  assert.equal(isResumeCrawlAdvance98Z3(0.5, 2500), false); // burst 0,2×: lành
  assert.equal(isResumeCrawlAdvance98Z3(1 / 30, 2500), true); // 0,013×: bò
  assert.equal(isResumeCrawlAdvance98Z3(1 / 30, 0), false); // chưa trôi thời gian
});

await ok("Z3-R3 replay d3 đợt 97: element bò 1 frame/tick 608ms (0,055×) → detector ARM ngay tick bò đầu (đủ 300ms), mốc hoàn tất = đầu bò; tick sau có watch thì không arm trùng; burst sau đó reset mốc", () => {
  let tr: ResumeFreezeTrack | null = null;
  tr = rearm(7000, 3.4, tr).track;
  const r1 = rearm(7608, 3.4 + 1 / 30, tr);
  assert.notEqual(r1.arm, null); // bò 608ms: arm (trước fix: reset mốc, không arm)
  assert.deepEqual(r1.arm, { ctAtCompletion: 3.4 + 1 / 30, completedAtMs: 7000 });
  assert.equal(r1.track?.lastAdvanceMs, 7000); // mốc KHÔNG đổi (bò không reset)
  const r2 = rearm(8216, 3.4 + 2 / 30, r1.track, { hasWatch: true });
  assert.equal(r2.arm, null); // đã có watch: không arm trùng
  const r3 = rearm(8300, 4.0, r1.track);
  assert.equal(r3.arm, null); // burst +0,57/1300ms = 0,44×: lành → reset mốc
  assert.equal(r3.track?.lastAdvanceMs, 8300);
  assert.equal(r3.track?.lastCt, 4.0);
});

await ok("Z3-R4 tích lũy chậm lành (V2-R9: 0,167×) VẪN reset mốc, không arm oan — ngưỡng 0,1× không nuốt trường hợp này", () => {
  let tr: ResumeFreezeTrack | null = null;
  tr = rearm(1000, 2.5, tr).track;
  const r1 = rearm(1100, 2.5 + 1 / 60, tr);
  assert.equal(r1.arm, null);
  assert.equal(r1.track?.lastAdvanceMs, 1000); // chưa đủ 1 frame: mốc chưa đổi
  const r2 = rearm(1200, 2.5 + 1 / 30, r1.track);
  assert.equal(r2.arm, null);
  assert.equal(r2.track?.lastAdvanceMs, 1200); // 1 frame/200ms = 0,167× >= 0,1: lành, mốc đổi
});

await ok("Z3-R5 shouldHoldForResumeStall: tăng BÒ 1 frame sau 2500ms (0,013×) thì VẪN GIỮ; burst +0,5s cùng lúc (0,2×) thì nhả", () => {
  assert.equal(resumeStall(true, 5000 + 2500, WATCH, 1.267 + 1 / 30), true); // bò: giữ
  assert.equal(resumeStall(true, 5000 + 2500, WATCH, 1.267 + 0.5), false); // burst: nhả
});

await ok("Z3-R6 predicate dùng cho dọn watch: tăng BÒ qua mốc hoàn tất thì watch ở lại; burst qua mốc thì watch hết", () => {
  // Watch hoàn tất ở ct=1,267 lúc 5000ms; element bò tới +1 frame lúc 5608ms.
  assert.equal(isResumeCrawlAdvance98Z3((1.267 + 1 / 30) - 1.267, 5608 - 5000), true);
  // Burst +0,6s cùng khoảng: tốc độ ~0,99× → watch hết.
  assert.equal(isResumeCrawlAdvance98Z3(0.6, 5608 - 5000), false);
});

// ---- Đợt 100 B3: burst KHÔNG được tính là advance của đuôi (nợ LIMITS gộp đợt 99 §4 mục 4 — ca f4 tail-expiry) ----

import {
  PLAYHEAD_TAIL_BURST_RATE_MAX,
} from "./playheadHold90R2.ts";

function tailStepB3(
  nowMs: number,
  currentCt: number,
  tail: ResumeGraceTail97Y4,
  playbackRate = 1,
) {
  return nextResumeGraceTail97Y4({
    playing: true,
    nowMs,
    currentCt,
    frameDur: 1 / 30,
    hasWatch: false,
    tail,
    playbackRate,
  });
}

await ok("B3-R1 PLAYHEAD_TAIL_BURST_RATE_MAX = 1,5 (pin: trên tốc độ lành tối đa ~1,2× kể cả jitter, dưới burst f4 thấp nhất ~1,9×; đổi số phải có ý thức)", () => {
  assert.equal(PLAYHEAD_TAIL_BURST_RATE_MAX, 1.5);
});

await ok("B3-R2 replay f4 đợt 99: burst +1,16s trong 1 tick (rate 2,9×) KHÔNG đếm + reset bộ đếm; đuôi chỉ đóng sau 2 lần tăng LÀNH sau burst (luật cũ đã đóng ngay tick tăng lành đầu)", () => {
  // f4: đuôi mở ở ct 4,2667 (endedAtMs 10464); burst tới 5,4242
  // (drift +2,49); luật cũ đếm burst là advance #1 rồi đóng đuôi ở
  // lần tăng sau → drift re-seek bắn vào decoder chưa ổn định, seek
  // kẹt 5,5 s+. Gap tick 400 ms như rAF dưới tải (xem LIMITS B3 §1).
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 4.2667 };
  const s0 = tailStepB3(10400, 4.2667, tail0);
  assert.notEqual(s0.tail, null);
  assert.equal(s0.tail?.advances, 0);
  const s1 = tailStepB3(10800, 5.4242, s0.tail!);
  assert.notEqual(s1.tail, null); // burst: KHÔNG đếm, đuôi vẫn mở
  assert.equal(s1.tail?.advances, 0);
  assert.equal(s1.tail?.lastCt, 5.4242); // rebase về điểm đáp của burst
  assert.equal(s1.burstBlocked, true);
  const s2 = tailStepB3(11200, 5.4242 + 1 / 30, s1.tail!);
  assert.notEqual(s2.tail, null); // tăng lành #1 sau burst: vẫn mở (luật cũ đã đóng ở đây)
  assert.equal(s2.tail?.advances, 1);
  assert.equal(s2.burstBlocked, undefined);
  const s3 = tailStepB3(11600, 5.4242 + 2 / 30, s2.tail!);
  assert.equal(s3.tail, null); // tăng lành #2 sau burst: đóng (decoder đã ổn định thật)
});

await ok("B3-R3 tăng lành 2 tick riêng biệt VẪN đóng đuôi như Y4-R3 (không chặn oan đường lành)", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.0 };
  const s1 = tailStepB3(10100, 1.0 + 1 / 30, tail0);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 1);
  assert.equal(s1.burstBlocked, undefined);
  const s2 = tailStepB3(10200, 1.0 + 2 / 30, s1.tail!);
  assert.equal(s2.tail, null);
});

await ok("B3-R4 burst reset bộ đếm (không chỉ bỏ qua): đã có advance #1 lành, burst tới thì về 0, phải đủ 2 lần tăng lành MỚI mới đóng", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.0 };
  const s1 = tailStepB3(10100, 1.0 + 1 / 30, tail0);
  assert.equal(s1.tail?.advances, 1);
  const s2 = tailStepB3(10200, 2.5, s1.tail!); // nhảy seek +1,47s/100ms = 14,7×
  assert.notEqual(s2.tail, null);
  assert.equal(s2.tail?.advances, 0);
  assert.equal(s2.tail?.lastCt, 2.5);
  assert.equal(s2.burstBlocked, true);
  const s3 = tailStepB3(10300, 2.5 + 1 / 30, s2.tail!);
  assert.equal(s3.tail?.advances, 1);
  const s4 = tailStepB3(10400, 2.5 + 2 / 30, s3.tail!);
  assert.equal(s4.tail, null);
});

await ok("B3-R5 giới hạn thật (ghi rõ, không giấu): burst +1,16s trải trên gap dài 2000ms có rate 0,58× nên VẪN ĐẾM — luật burst-rate không phân biệt được với decode lành trên gap dài", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 4.2667 };
  const s1 = tailStepB3(12000, 5.4242, tail0);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 1); // lọt (xem LIMITS B3 §6)
  assert.equal(s1.burstBlocked, undefined);
});

await ok("B3-R6 clip speed 2×: tăng +0,8s trong gap 400ms ở playbackRate 2 là lành (chuẩn hóa 1,0×) → đếm, không chặn oan", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.0 };
  const s1 = tailStepB3(10400, 1.8, tail0, 2);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 1);
  assert.equal(s1.burstBlocked, undefined);
  const s2 = tailStepB3(10800, 2.6, s1.tail!, 2);
  assert.equal(s2.tail, null);
});

await ok("B3-R7 tương thích ngược: đuôi cũ không có lastTickMs + gọi không truyền playbackRate vẫn chạy như Y4 (2 lần tăng lành đóng; burst c1 1,46× vẫn đếm — xem Y4-R2)", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 1000, advances: 0, lastCt: 1.0 };
  const s1 = tailStep(1100, 1.0 + 1 / 30, tail0);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 1);
  const s2 = tailStep(1200, 1.0 + 2 / 30, s1.tail!);
  assert.equal(s2.tail, null);
});

await ok("B3-R8 tick đóng băng không làm loãng mẫu số rate: đóng băng 3 tick rồi tăng lành 1 frame → đếm (rate tính theo gap tick hiện tại, không theo thời gian từ lần tăng cuối)", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.0 };
  const s1 = tailStepB3(10400, 1.0, tail0);
  assert.equal(s1.tail?.advances, 0);
  const s2 = tailStepB3(10800, 1.0, s1.tail!);
  assert.equal(s2.tail?.advances, 0);
  const s3 = tailStepB3(11200, 1.0, s2.tail!);
  assert.equal(s3.tail?.advances, 0);
  const s4 = tailStepB3(11600, 1.0 + 1 / 30, s3.tail!);
  assert.notEqual(s4.tail, null);
  assert.equal(s4.tail?.advances, 1); // 1 frame/400ms = 0,083×: lành
});

await ok("B3-R9 gap <= 0 (cùng timestamp — không đo được tốc độ) thì đếm như cũ, không chặn oan", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.0 };
  const s1 = tailStepB3(10000, 1.0 + 1 / 30, tail0);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 1);
  assert.equal(s1.burstBlocked, undefined);
});

// ---- Đợt 101 C3: drift-gate — lần tăng chỉ đếm khi đáp trong ngưỡng drift
// (nợ LIMITS gộp đợt 100 §4 mục 5 — burst dài-gap g2/g5 lọt luật rate B3;
// xem docs/PHASE9_ROUND101_C3_REARM_LIMITS.md §1) ----

import {
  PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S,
} from "./playheadHold90R2.ts";
import { FORWARD_RESEEK_THRESHOLD_S } from "./playheadPacing.ts";

function tailStepC3(
  nowMs: number,
  currentCt: number,
  tail: ResumeGraceTail97Y4,
  drift?: number,
  playbackRate = 1,
) {
  return nextResumeGraceTail97Y4({
    playing: true,
    nowMs,
    currentCt,
    frameDur: 1 / 30,
    hasWatch: false,
    tail,
    playbackRate,
    drift,
  });
}

await ok("C3-R1 PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S = 0,35 == FORWARD_RESEEK_THRESHOLD_S (pin: ngưỡng gate là đúng ngưỡng drift re-seek — đuôi ân hạn seek thì không được đóng khi drift còn vượt ngưỡng seek; đổi số phải có ý thức)", () => {
  assert.equal(PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S, 0.35);
  assert.equal(PLAYHEAD_TAIL_CLOSE_DRIFT_MAX_S, FORWARD_RESEEK_THRESHOLD_S);
});

await ok("C3-R2 replay g2 đợt 100: lần tăng #1 +0,97s/684ms (rate 1,41× — LỌT luật rate B3) đáp với drift +1,067 thì KHÔNG đếm + reset; lần tăng #2 +0,10s đáp drift +0,50 cũng KHÔNG đếm — đuôi vẫn mở (luật cũ đã đóng ở đây)", () => {
  // g2 (probe-webkit-load4-gop30-g2): đuôi mở ở ct 1,6 (drift +0,633);
  // tick sau ct nhảy +0,9667 (gap probe 684 ms, rate 1,41× < 1,5× nên
  // B3 đếm là advance #1), đáp với drift +1,067 (biên thật +1,067…
  // +1,600 do tick app ẩn giữa 2 mẫu probe — test dùng đầu dưới, là
  // giá trị bảo thủ nhất mà gate vẫn phải chặn). Tick sau +0,10 → luật
  // cũ đóng đuôi ở drift +0,50. Gate chặn cả hai.
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.6 };
  const s0 = tailStepC3(10391, 1.6, tail0, 0.633);
  assert.notEqual(s0.tail, null); // tick đóng băng: giữ đuôi, không gate
  assert.equal(s0.tail?.advances, 0);
  const s1 = tailStepC3(11075, 2.5667, s0.tail!, 1.067);
  assert.notEqual(s1.tail, null); // đáp xa: KHÔNG đếm, đuôi vẫn mở
  assert.equal(s1.tail?.advances, 0);
  assert.equal(s1.tail?.lastCt, 2.5667); // rebase về điểm đáp
  assert.equal(s1.driftGateBlocked, true);
  assert.equal(s1.burstBlocked, undefined); // rate 1,41× KHÔNG chặn — chỉ gate chặn
  const s2 = tailStepC3(11687, 2.6667, s1.tail!, 0.5);
  assert.notEqual(s2.tail, null); // đáp xa lần nữa: vẫn không đếm
  assert.equal(s2.tail?.advances, 0);
  assert.equal(s2.driftGateBlocked, true);
});

await ok("C3-R3 replay g5 đợt 100: lần tăng #1 +0,90s/788ms (rate 1,14× — dưới cả tốc độ lành tối đa ~1,2×) đáp drift +0,933 thì KHÔNG đếm; #2 +0,67s đáp +0,867 cũng KHÔNG đếm — đuôi vẫn mở", () => {
  // g5 (probe-webkit-load4-gop250-g5): đuôi mở ở ct 1,4 (drift +0,5);
  // #1 +0,90 (rate 1,14×) đáp drift +0,933 (biên thật +0,933…+1,400);
  // #2 +0,67 đáp drift +0,867. Luật cũ đóng đuôi ở #2.
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.4 };
  const s1 = tailStepC3(10788, 2.3, tail0, 0.933);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 0);
  assert.equal(s1.driftGateBlocked, true);
  assert.equal(s1.burstBlocked, undefined);
  const s2 = tailStepC3(11486, 2.9667, s1.tail!, 0.867);
  assert.notEqual(s2.tail, null);
  assert.equal(s2.tail?.advances, 0);
  assert.equal(s2.driftGateBlocked, true);
});

await ok("C3-R4 replay f4 đợt 99 CÓ drift: burst +1,16s/400ms vừa nhanh (rate 2,9×) vừa đáp xa (drift +2,49) — luật rate chặn TRƯỚC (burstBlocked, không phải driftGateBlocked); sau đó 2 lần tăng lành đáp đúng vị trí thì đóng đuôi", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 4.2667 };
  const s0 = tailStepC3(10400, 4.2667, tail0, 1.867);
  assert.notEqual(s0.tail, null);
  const s1 = tailStepC3(10800, 5.4242, s0.tail!, 2.491);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 0);
  assert.equal(s1.burstBlocked, true); // rate chặn trước
  assert.equal(s1.driftGateBlocked, undefined);
  const s2 = tailStepC3(11200, 5.4242 + 1 / 30, s1.tail!, 0.1);
  assert.notEqual(s2.tail, null);
  assert.equal(s2.tail?.advances, 1);
  assert.equal(s2.driftGateBlocked, undefined);
  const s3 = tailStepC3(11600, 5.4242 + 2 / 30, s2.tail!, 0.08);
  assert.equal(s3.tail, null); // tăng lành #2 đáp đúng vị trí: đóng
});

await ok("C3-R5 đường lành KHÔNG bị chặn oan: 2 lần tăng 1 frame đáp với drift +0,10/+0,12 thì đóng đuôi như Y4 (kể cả drift đúng biên +0,35 vẫn đếm)", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.0 };
  const s1 = tailStepC3(10100, 1.0 + 1 / 30, tail0, 0.1);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 1);
  assert.equal(s1.driftGateBlocked, undefined);
  const s2 = tailStepC3(10200, 1.0 + 2 / 30, s1.tail!, 0.12);
  assert.equal(s2.tail, null);
  // Biên: drift đúng +0,35 (không vượt ngưỡng) vẫn đếm.
  const tailB: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 2.0 };
  const b1 = tailStepC3(10100, 2.0 + 1 / 30, tailB, 0.35);
  assert.equal(b1.tail?.advances, 1);
  assert.equal(b1.driftGateBlocked, undefined);
  const b2 = tailStepC3(10200, 2.0 + 2 / 30, b1.tail!, 0.35);
  assert.equal(b2.tail, null);
});

await ok("C3-R6 ca f2 đợt 99: lần tăng #1 +0,37s đáp drift +0,467 thì KHÔNG đếm (đáp xa); sau khi element đóng băng để playhead đuổi kịp (drift về +0,20) thì 2 lần tăng 1 frame đáp đúng vị trí ĐÓNG đuôi — gate chỉ hoãn, không kẹt đuôi", () => {
  // f2: đuôi mở ở ct 1,7 (drift +0,233); #1 +0,3667/271ms (rate 1,35×)
  // đáp drift +0,467; rồi element đóng băng, ph đuổi kịp, #2 đáp drift
  // +0,233 → luật cũ đóng. Gate chặn #1, nhưng đuôi vẫn đóng được ngay
  // khi có lần tăng đáp đúng vị trí.
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.7 };
  const s1 = tailStepC3(10271, 1.7 + 11 / 30, tail0, 0.467);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 0);
  assert.equal(s1.driftGateBlocked, true);
  const s2 = tailStepC3(10671, 1.7 + 11 / 30, s1.tail!, 0.3); // đóng băng: giữ đuôi
  assert.equal(s2.tail?.advances, 0);
  const s3 = tailStepC3(11071, 1.7 + 12 / 30, s2.tail!, 0.2); // tăng đúng 1 frame đáp đúng: đếm #1
  assert.notEqual(s3.tail, null);
  assert.equal(s3.tail?.advances, 1);
  assert.equal(s3.driftGateBlocked, undefined);
  const s4 = tailStepC3(11471, 1.7 + 13 / 30, s3.tail!, 0.15);
  assert.equal(s4.tail, null); // đóng (không kẹt)
});

await ok("C3-R7 clip speed 2×: tăng +0,8s/400ms ở playbackRate 2 đáp drift +0,10 thì đếm (chuẩn hóa 1,0× + đáp đúng); tăng lành-về-tốc-độ nhưng đáp drift +0,50 thì gate chặn", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.0 };
  const s1 = tailStepC3(10400, 1.8, tail0, 0.1, 2);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 1);
  assert.equal(s1.driftGateBlocked, undefined);
  const s2 = tailStepC3(10800, 2.6, s1.tail!, 0.05, 2);
  assert.equal(s2.tail, null);
  const tailB: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 3.0 };
  const b1 = tailStepC3(10400, 3.8, tailB, 0.5, 2);
  assert.notEqual(b1.tail, null);
  assert.equal(b1.tail?.advances, 0);
  assert.equal(b1.driftGateBlocked, true);
});

await ok("C3-R8 tương thích ngược: không truyền drift thì chạy như B3 (burst dài-gap B3-R5 VẪN đếm — gate bỏ qua khi không biết drift; burst nhanh vẫn bị rate chặn)", () => {
  // B3-R5, không drift: burst +1,16s trải gap 2000ms (rate 0,58×) vẫn đếm.
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 4.2667 };
  const s1 = tailStepB3(12000, 5.4242, tail0);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 1);
  assert.equal(s1.driftGateBlocked, undefined);
  // Burst nhanh không drift vẫn bị rate chặn (B3-R2).
  const tailB: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 4.2667 };
  const b1 = tailStepC3(10400, 5.4242, tailB, undefined);
  assert.notEqual(b1.tail, null);
  assert.equal(b1.tail?.advances, 0);
  assert.equal(b1.burstBlocked, true);
});

await ok("C3-R9 biên drift: +0,351 / −0,351 thì chặn, ±0,35 thì đếm; drift âm lớn (−0,50) cũng chặn như drift dương", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 1.0 };
  const s1 = tailStepC3(10100, 1.0 + 1 / 30, tail0, 0.351);
  assert.equal(s1.tail?.advances, 0);
  assert.equal(s1.driftGateBlocked, true);
  const tailB: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 2.0 };
  const b1 = tailStepC3(10100, 2.0 + 1 / 30, tailB, -0.5);
  assert.equal(b1.tail?.advances, 0);
  assert.equal(b1.driftGateBlocked, true);
  const b2 = tailStepC3(10500, 2.0 + 2 / 30, b1.tail!, -0.2);
  assert.equal(b2.tail?.advances, 1); // đáp đúng vị trí (âm nhỏ): đếm
  assert.equal(b2.driftGateBlocked, undefined);
  const tailC: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 3.0 };
  const c1 = tailStepC3(10100, 3.0 + 1 / 30, tailC, -0.35);
  assert.equal(c1.tail?.advances, 1); // biên âm đúng −0,35: đếm
});

await ok("C3-R10 điểm mù B3-R5 nay ĐÓNG khi biết drift: cùng số B3-R5 (burst +1,16s/gap 2000ms, rate 0,58×) nhưng đáp drift +2,49 thì gate chặn — không đếm, reset, đuôi vẫn mở", () => {
  const tail0: ResumeGraceTail97Y4 = { endedAtMs: 10000, advances: 0, lastCt: 4.2667 };
  const s1 = tailStepC3(12000, 5.4242, tail0, 2.49);
  assert.notEqual(s1.tail, null);
  assert.equal(s1.tail?.advances, 0);
  assert.equal(s1.tail?.lastCt, 5.4242);
  assert.equal(s1.driftGateBlocked, true);
  assert.equal(s1.burstBlocked, undefined); // rate 0,58× không chặn — chỉ gate chặn
});

console.log(`playheadHold90R2.test: ${pass} passed`);
