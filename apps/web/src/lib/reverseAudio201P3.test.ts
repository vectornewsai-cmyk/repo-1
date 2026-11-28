// reverseAudio201P3.test.ts — Đợt 201 P3: unit test TRỰC TIẾP cho guard
// gần mép của clamp (nợ từ (r)-200: guard `outsideBy <= sampleRate`
// trong tickEntry chưa có test trực tiếp — chỉ được kiểm gián tiếp qua
// pass headed longA-199 (9 playFalse → 0 sau khi thêm clamp).
//
// Guard: sau khi cửa sổ đảo đổi (cờ windowJustRebuiltAtCtxSec còn tươi
// ≤ 3 s), offset kỳ vọng ngoài cửa sổ CHỈ được clamp về mép khi lệch
// khỏi mép ≤ 1 s (outsideBy <= sampleRate); xa hơn là playhead nhảy /
// seek thật → để playFalse, chờ rebuild, không phát nhầm tiếng cửa sổ
// cũ. Cờ bị xóa khi tick này KHÔNG cần clamp (đã vào cửa sổ / hết tươi
// / lệch xa), và ĐƯỢC GIỮ khi vừa phải clamp (tick sau vẫn cần).
//
// Fixture: decoded giả 40 s @1000 Hz (full decode — không qua partial
// MP4; đường partial đã có test 199). Load ở source 35 s → cửa sổ
// [5, 35] s: lo=5000, hi=34999 mẫu, sampleRate guard = 1000 mẫu/s.
// Offset(s) = (40 − s) × 1000. Mép dưới: s=35,5 → ngoài 500 (clamp);
// s=36 → ngoài đúng 1000 (clamp, biên bao hàm); s=36,001 → ngoài 1001
// (KHÔNG clamp). Mép trên: s=4,5 → ngoài 501 (clamp); s=4 → ngoài
// 1001 (KHÔNG clamp).
//   node --experimental-strip-types apps/web/src/lib/reverseAudio201P3.test.ts
import assert from "node:assert/strict";
import {
  ReverseAudioPlayer,
  type ReversedAudioBufferLike,
  type ReversedAudioContextLike,
} from "./reverseAudio.ts";
import {
  ReverseAudioWiring,
  type ReverseAudioWiringEntry,
} from "./reverseAudioWiring.ts";

let pass = 0;
async function okAsync(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

function fakeBuffer(channels: Float32Array[], sampleRate = 1000): ReversedAudioBufferLike {
  return {
    numberOfChannels: channels.length,
    length: channels[0]?.length ?? 0,
    sampleRate,
    duration: (channels[0]?.length ?? 0) / sampleRate,
    getChannelData: (ch: number) => channels[ch],
  };
}

interface StartedRec { offset: number; dur: number; }
function makeFakeCtx(decoded: ReversedAudioBufferLike, sampleRate = 1000): {
  ctx: ReversedAudioContextLike;
  started: StartedRec[];
  setNow: (t: number) => void;
} {
  const started: StartedRec[] = [];
  let now = 0;
  const ctx = {
    sampleRate,
    get currentTime() { return now; },
    state: "running",
    destination: {},
    decodeAudioData: async () => decoded,
    createBuffer: (ch: number, len: number, sr: number) => {
      const arrs = Array.from({ length: ch }, () => new Float32Array(len));
      return fakeBuffer(arrs, sr);
    },
    createBufferSource: () => ({
      buffer: null as ReversedAudioBufferLike | null,
      playbackRate: { value: 1 },
      connect: () => {},
      disconnect: () => {},
      start: (_w?: number, o?: number, d?: number) => {
        started.push({ offset: o ?? 0, dur: d ?? 0 });
      },
      stop: () => {},
    }),
    createGain: () => ({
      gain: {
        value: 1,
        setTargetAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => {},
      disconnect: () => {},
    }),
    resume: async () => {},
  } as unknown as ReversedAudioContextLike;
  return { ctx, started, setNow: (t: number) => { now = t; } };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
// Clip windowed 300 s (entry) nhưng PCM thật 40 s @1000 Hz:
// load ở source 35 s → cửa sổ [5, 35] s, lo=5000, hi=34999 mẫu.
function entry(over: Partial<ReverseAudioWiringEntry> = {}): ReverseAudioWiringEntry {
  return {
    clipKey: "clip1",
    url: "blob:audio1",
    sourceDurationSec: 300,
    sourceTimeSec: 35,
    gain: 1,
    speed: 1,
    ...over,
  };
}
async function loadedWiring(): Promise<{
  w: ReverseAudioWiring;
  f: ReturnType<typeof makeFakeCtx>;
}> {
  const decoded = fakeBuffer([new Float32Array(40_000)], 1000);
  const f = makeFakeCtx(decoded, 1000);
  f.setNow(0);
  const w = new ReverseAudioWiring(f.ctx, {}, async () => new ArrayBuffer(8));
  w.tick(35, [entry({ sourceTimeSec: 35 })]);
  await tick();
  await tick();
  await tick();
  assert.equal(w.loadedCount, 1, "load cửa sổ đầu phải xong");
  const snap = w.debugSnapshot();
  assert.equal(snap.windows[0].windowStartSec, 5, `windowStartSec=${snap.windows[0].windowStartSec}`);
  assert.equal(snap.windows[0].windowEndSec, 35, `windowEndSec=${snap.windows[0].windowEndSec}`);
  return { w, f };
}
const counters = (w: ReverseAudioWiring) => w.debugSnapshot().counters;

await okAsync("guard mép dưới: ngoài 0,5 s thì clamp về mép (playClamped=1)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(35.5, [entry({ sourceTimeSec: 35.5 })]); // offset 4500, ngoài 500 mẫu
  assert.equal(f.started.length, 1, "phải phát 1 đoạn (đã clamp)");
  assert.equal(f.started[0].offset, 0, `offset giây=${f.started[0].offset}, kỳ vọng 0 (mép lo)`);
  assert.equal(counters(w).playClamped, 1);
  assert.equal(counters(w).playFalse, 0);
  assert.equal(counters(w).playOk, 1);
});

await okAsync("guard mép dưới: ngoài ĐÚNG 1 s (1000 mẫu) thì clamp (biên bao hàm)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(36, [entry({ sourceTimeSec: 36 })]); // offset 4000, ngoài đúng 1000 mẫu
  assert.equal(f.started.length, 1);
  assert.equal(f.started[0].offset, 0);
  assert.equal(counters(w).playClamped, 1);
  assert.equal(counters(w).playFalse, 0);
});

await okAsync("guard mép dưới: ngoài 1 s + 1 mẫu thì KHÔNG clamp (playFalse, cờ xóa)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(36.001, [entry({ sourceTimeSec: 36.001 })]); // offset 3999, ngoài 1001 mẫu
  assert.equal(f.started.length, 0, "không được phát nhầm tiếng cửa sổ cũ");
  assert.equal(counters(w).playClamped, 0);
  assert.equal(counters(w).playFalse, 1);
  // Cờ đã bị xóa ở tick lệch xa → tick sau ở 35,5 (gần mép) cũng KHÔNG clamp nữa.
  w.tick(35.5, [entry({ sourceTimeSec: 35.5 })]);
  assert.equal(f.started.length, 0);
  assert.equal(counters(w).playClamped, 0);
  assert.equal(counters(w).playFalse, 2);
});

await okAsync("guard mép trên: ngoài 0,501 s thì clamp về mép trên", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  // s=4,5 → offset 35500, ngoài hi (34999) 501 mẫu. Tick này kích
  // rebuild nền (s < wStart+5); đường rebuild qua cache-hit của fake
  // ĐỔI CỬA SỔ ĐỒNG BỘ trong cùng tick (loadReversedWindow nhánh cache
  // không có await) nên guard không kịp thấy cửa sổ cũ — khác đường
  // partial thật (async ~2 s). Để test TRỰC TIẾP guard (nhiệm vụ của
  // nó là khoảng trống trước khi rebuild đáp), giả lập rebuild đang
  // bay: rebuilding=true để khối rebuild bị bỏ qua, guard chạy trên
  // cửa sổ cũ [5, 35]. Assert đồng bộ, không await giữa chừng.
  (w as unknown as { players: Map<string, { rebuilding: boolean }> }).players.get("clip1")!.rebuilding = true;
  w.tick(4.5, [entry({ sourceTimeSec: 4.5 })]);
  assert.equal(f.started.length, 1);
  assert.equal(f.started[0].offset, 29.999, `offset giây=${f.started[0].offset}, kỳ vọng 29,999 (mép hi)`);
  assert.equal(counters(w).playClamped, 1);
  assert.equal(counters(w).playFalse, 0);
});

await okAsync("guard mép trên: ngoài 1,001 s thì KHÔNG clamp", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  // Như test trên: giả lập rebuild đang bay để guard chạy trên cửa sổ cũ.
  (w as unknown as { players: Map<string, { rebuilding: boolean }> }).players.get("clip1")!.rebuilding = true;
  w.tick(4, [entry({ sourceTimeSec: 4 })]); // offset 36000, ngoài hi 1001 mẫu
  assert.equal(f.started.length, 0, "không được phát nhầm tiếng cửa sổ cũ");
  assert.equal(counters(w).playClamped, 0);
  assert.equal(counters(w).playFalse, 1);
});

await okAsync("guard hết tươi (> 3 s sau rebuild) thì KHÔNG clamp dù gần mép", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(3.5); // cờ đặt lúc load (now=0) → 3,5 s sau đã hết tươi
  w.tick(35.5, [entry({ sourceTimeSec: 35.5 })]);
  assert.equal(f.started.length, 0);
  assert.equal(counters(w).playClamped, 0);
  assert.equal(counters(w).playFalse, 1);
});

await okAsync("guard còn tươi đúng 3,0 s thì vẫn clamp (biên bao hàm)", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(3.0); // 3,0 − 0 = 3,0 ≤ 3 → còn tươi
  w.tick(35.5, [entry({ sourceTimeSec: 35.5 })]);
  assert.equal(f.started.length, 1);
  assert.equal(counters(w).playClamped, 1);
  assert.equal(counters(w).playFalse, 0);
});

await okAsync("cờ được GIỮ sau khi clamp: đoạn hết hạn rồi tick gần mép vẫn clamp tiếp", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  w.tick(35.5, [entry({ sourceTimeSec: 35.5 })]);
  assert.equal(counters(w).playClamped, 1);
  // Đoạn 0,5 s hết hạn ở now=0,6 → tick lại ở 35,4 (KHÁC playhead tick
  // trước 35,5 để không rơi vào nhánh hold): restart thường rồi clamp
  // tiếp (cờ không bị xóa ở tick clamp trước).
  f.setNow(0.6);
  w.tick(35.4, [entry({ sourceTimeSec: 35.4 })]);
  assert.equal(f.started.length, 2);
  assert.equal(f.started[1].offset, 0);
  assert.equal(counters(w).playClamped, 2);
  assert.equal(counters(w).playFalse, 0);
});

await okAsync("tick trong cửa sổ thì không clamp + cờ bị xóa", async () => {
  const { w, f } = await loadedWiring();
  f.setNow(0);
  // Tick 1 ở 34,9 (offset 5100, trong cửa sổ; KHÁC playhead tick load
  // 35 để không rơi vào nhánh hold): phát ở relStart 100, không clamp,
  // cờ bị xóa vì tick này không cần clamp.
  w.tick(34.9, [entry({ sourceTimeSec: 34.9 })]);
  assert.equal(f.started.length, 1);
  assert.equal(f.started[0].offset, 0.1);
  assert.equal(counters(w).playClamped, 0);
  assert.equal(counters(w).playOk, 1);
  // Tick sau ở 35,5 (ngoài 500 mẫu): cờ đã xóa ở tick trong cửa sổ →
  // KHÔNG clamp nữa, playFalse (đoạn cũ restart rồi phát offset ngoài cửa sổ).
  w.tick(35.5, [entry({ sourceTimeSec: 35.5 })]);
  assert.equal(f.started.length, 1, "tick 2 không được phát (đã hết cờ clamp)");
  assert.equal(counters(w).playClamped, 0);
  assert.equal(counters(w).playFalse, 1);
});

await okAsync("player clampSampleOffsetToWindow: kẹp cả hai mép, trong cửa sổ giữ nguyên", async () => {
  // Load toàn bộ 40 s → cửa sổ = cả file: lo=0, hi=39999 mẫu @1000 Hz.
  const decoded = fakeBuffer([new Float32Array(40_000)], 1000);
  const f = makeFakeCtx(decoded, 1000);
  const p = new ReverseAudioPlayer(f.ctx, {});
  assert.equal(await p.loadReversed(new ArrayBuffer(8), 60), true);
  assert.equal(p.clampSampleOffsetToWindow(-5), 0);
  assert.equal(p.clampSampleOffsetToWindow(0), 0);
  assert.equal(p.clampSampleOffsetToWindow(20000), 20000);
  assert.equal(p.clampSampleOffsetToWindow(39999), 39999);
  assert.equal(p.clampSampleOffsetToWindow(40000), 39999);
  assert.equal(p.clampSampleOffsetToWindow(999999), 39999);
});

console.log(`reverseAudio201P3: ${pass} test PASS`);
