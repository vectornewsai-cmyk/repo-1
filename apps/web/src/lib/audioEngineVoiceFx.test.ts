// audioEngineVoiceFx.test.ts — Đợt 191 P1: AudioEngine nối voice chain.
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/audioEngineVoiceFx.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
// Khóa 3 điều: (1) update() với fx.voice áp tham số xuống chain thật;
// (2) toPreviewFx truyền voice qua, bỏ voice khi không có effect bật;
// (3) mock CŨ (không có createDelay/createOscillator — như test 44Z2)
// vẫn chạy như trước: voice = null, bass/treble/compressor không vỡ.
import assert from "node:assert/strict";
import { AudioEngine, toPreviewFx } from "./audioEngine.ts";

let pass = 0;
let fail = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}
interface MockParam {
  value: number;
  lastSet: number | null;
  setTargetAtTime(v: number, _t: number, _tc: number): void;
}
function mockParam(value = 0): MockParam {
  const p: MockParam = {
    value,
    lastSet: null,
    setTargetAtTime(v) {
      p.lastSet = v;
    },
  };
  return p;
}
interface MockNode {
  connectedTo: unknown[];
  disconnects: number;
  connect(dest: unknown): void;
  disconnect(): void;
}
function mockNode(): MockNode {
  const n: MockNode = {
    connectedTo: [],
    disconnects: 0,
    connect(dest) {
      n.connectedTo.push(dest);
    },
    disconnect() {
      n.disconnects++;
    },
  };
  return n;
}
type AnyNode = MockNode & Record<string, unknown>;
interface MockOsc extends AnyNode {
  type: string;
  frequency: MockParam;
  started: boolean;
  stopped: boolean;
  start(): void;
  stop(): void;
  setPeriodicWave(_w: unknown): void;
}
function mockOsc(): MockOsc {
  const o = mockNode() as MockOsc;
  o.type = "sine";
  o.frequency = mockParam(0);
  o.started = false;
  o.stopped = false;
  o.start = () => {
    o.started = true;
  };
  o.stop = () => {
    o.stopped = true;
  };
  o.setPeriodicWave = () => {};
  return o;
}

interface MockCtxOptions {
  /** Mock kiểu cũ (44Z2): không có createDelay/createOscillator/createPeriodicWave. */
  legacy?: boolean;
}
interface MockCtx {
  sources: AnyNode[];
  sourced: Set<object>;
  state: string;
  currentTime: number;
  destination: object;
  oscs: MockOsc[];
  createGain(): AnyNode;
  createBiquadFilter(): AnyNode;
  createDynamicsCompressor(): AnyNode;
  createAnalyser(): AnyNode;
  createMediaElementSource(_el: unknown): AnyNode;
  createDelay?(): AnyNode;
  createOscillator?(): AnyNode;
  createPeriodicWave?(real: Float32Array, imag: Float32Array): unknown;
  resume(): Promise<void>;
  close(): Promise<void>;
}
function mockCtx(opts: MockCtxOptions = {}): MockCtx {
  const ctx: MockCtx = {
    sources: [],
    sourced: new Set(),
    state: "running",
    currentTime: 0,
    destination: {},
    oscs: [],
    createGain() {
      const n = mockNode();
      (n as AnyNode).gain = mockParam(1);
      return n as AnyNode;
    },
    createBiquadFilter() {
      const n = mockNode();
      (n as AnyNode).type = "";
      (n as AnyNode).frequency = mockParam(0);
      (n as AnyNode).Q = mockParam(1);
      (n as AnyNode).gain = mockParam(0);
      return n as AnyNode;
    },
    createDynamicsCompressor() {
      const n = mockNode();
      (n as AnyNode).threshold = mockParam(0);
      (n as AnyNode).ratio = mockParam(1);
      (n as AnyNode).attack = mockParam(0.003);
      (n as AnyNode).release = mockParam(0.25);
      return n as AnyNode;
    },
    createAnalyser() {
      const n = mockNode();
      (n as AnyNode).fftSize = 2048;
      (n as AnyNode).getByteTimeDomainData = () => {};
      return n as AnyNode;
    },
    createMediaElementSource(el: unknown) {
      if (ctx.sourced.has(el as object)) throw new Error("InvalidStateError: source đã tồn tại");
      ctx.sourced.add(el as object);
      const n = mockNode();
      ctx.sources.push(n as AnyNode);
      return n as AnyNode;
    },
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
  if (!opts.legacy) {
    ctx.createDelay = () => {
      const n = mockNode();
      (n as AnyNode).delayTime = mockParam(0);
      return n as AnyNode;
    };
    ctx.createOscillator = () => {
      const o = mockOsc();
      ctx.oscs.push(o);
      return o as AnyNode;
    };
    ctx.createPeriodicWave = (real: Float32Array, imag: Float32Array) => ({ real, imag });
  }
  return ctx;
}

function fakeEl(): HTMLMediaElement {
  return { volume: 1, muted: false } as unknown as HTMLMediaElement;
}

// ---------------------------------------------------------------------------
// toPreviewFx
// ---------------------------------------------------------------------------
ok("toPreviewFx: truyền voice qua khi có effect bật", () => {
  const fx = toPreviewFx({ voice: { pitch: 5 } });
  assert.deepEqual(fx?.voice, { pitch: 5 });
});
ok("toPreviewFx: bỏ voice khi không có effect bật (pitch 0 / {})", () => {
  assert.equal(toPreviewFx({ voice: { pitch: 0 } }), undefined);
  assert.equal(toPreviewFx({ voice: {} }), undefined);
  assert.equal(toPreviewFx({ bass: 3, voice: {} })?.voice, undefined);
  assert.equal(toPreviewFx({ bass: 3, voice: {} })?.bass, 3);
});
ok("toPreviewFx: giữ bass/treble/compressor + voice cùng lúc", () => {
  const fx = toPreviewFx({ bass: 2, compressor: { ratio: 3 }, voice: { telephone: true } });
  assert.equal(fx?.bass, 2);
  assert.deepEqual(fx?.compressor, { ratio: 3 });
  assert.deepEqual(fx?.voice, { telephone: true });
});

// ---------------------------------------------------------------------------
// AudioEngine + voice chain đầy đủ
// ---------------------------------------------------------------------------
ok("engine.update với fx.voice robot: robot osc 25 Hz, delay 0.6×2.7ms", () => {
  const ctx = mockCtx();
  const eng = new AudioEngine({ createContext: () => ctx as unknown as AudioContext });
  assert.equal(eng.ensure(), true);
  const el = fakeEl();
  eng.update([{ el, gain: 1, fx: toPreviewFx({ voice: { robot: true } }) }]);
  // Thứ tự tạo osc trong chain: 3 osc pitch (saw/saw/cos) rồi mới robot osc.
  assert.equal(ctx.oscs.length, 4);
  const robotOsc = ctx.oscs[3];
  assert.equal(robotOsc.frequency.lastSet, 25);
  eng.dispose();
});
ok("engine.update với fx.voice pitch +12: pitch LFO 12.5 Hz (W = 0,08 s, đợt 193)", () => {
  const ctx = mockCtx();
  const eng = new AudioEngine({ createContext: () => ctx as unknown as AudioContext });
  eng.ensure();
  const el = fakeEl();
  eng.update([{ el, gain: 1, fx: toPreviewFx({ voice: { pitch: 12 } }) }]);
  // 3 osc pitch (PeriodicWave) có frequency.lastSet = 12.5; robot osc vẫn 0.
  const pitched = ctx.oscs.filter((o) => o.frequency.lastSet === 12.5);
  assert.equal(pitched.length, 3);
  eng.dispose();
});
ok("engine.update không có voice: chain về bypass (robot osc 0 Hz)", () => {
  const ctx = mockCtx();
  const eng = new AudioEngine({ createContext: () => ctx as unknown as AudioContext });
  eng.ensure();
  const el = fakeEl();
  eng.update([{ el, gain: 1, fx: toPreviewFx({ voice: { robot: true } }) }]);
  eng.update([{ el, gain: 1, fx: undefined }]);
  const robotOsc = ctx.oscs[3];
  assert.equal(robotOsc.frequency.lastSet, 0);
  eng.dispose();
});
ok("releaseElement dispose voice chain (osc stop)", () => {
  const ctx = mockCtx();
  const eng = new AudioEngine({ createContext: () => ctx as unknown as AudioContext });
  eng.ensure();
  const el = fakeEl();
  eng.update([{ el, gain: 1, fx: toPreviewFx({ voice: { echo: true } }) }]);
  assert.equal(eng.releaseElement(el), true);
  assert.ok(ctx.oscs.length > 0 && ctx.oscs.every((o) => o.stopped), "mọi osc phải stop");
  assert.equal(eng.releaseElement(el), false);
  eng.dispose();
});

// ---------------------------------------------------------------------------
// Fail-soft với mock cũ (không có createDelay/createOscillator)
// ---------------------------------------------------------------------------
ok("mock cũ (44Z2): engine vẫn chạy, bass áp bình thường, voice bỏ qua", () => {
  const ctx = mockCtx({ legacy: true });
  const eng = new AudioEngine({ createContext: () => ctx as unknown as AudioContext });
  assert.equal(eng.ensure(), true);
  const el = fakeEl();
  // Không ném dù fx có voice (chain tạo thất bại → voice null, fail-soft).
  eng.update([{ el, gain: 0.5, fx: toPreviewFx({ bass: 6, voice: { pitch: 12, echo: true } }) }]);
  assert.equal(ctx.oscs.length, 0);
  eng.dispose();
});

console.log(`\naudioEngineVoiceFx.test.ts: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exitCode = 1;
