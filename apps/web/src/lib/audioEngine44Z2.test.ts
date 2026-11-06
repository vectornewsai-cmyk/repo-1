// audioEngine44Z2.test.ts — Đợt 44 luồng Z2: rò AudioEngine khi
// MediaPool.dropElement (nợ đợt 43 Y2 §5.4, xem
// docs/PHASE9_ROUND44_Z2_PAUSE_LIMITS.md).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/audioEngine44Z2.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
// Mock AudioContext đếm connect/disconnect + số lần createMediaElementSource
// để khóa vòng đời node, không cần Web Audio thật.
import assert from "node:assert/strict";
import { AudioEngine } from "./audioEngine.ts";

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

interface MockNode {
  connects: number;
  disconnects: number;
  connect(): void;
  disconnect(): void;
}
function mockNode(): MockNode {
  const n: MockNode = {
    connects: 0,
    disconnects: 0,
    connect() {
      n.connects++;
    },
    disconnect() {
      n.disconnects++;
    },
  };
  return n;
}
interface MockParam {
  value: number;
  setTargetAtTime(): void;
}
function mockParam(value = 0): MockParam {
  return {
    value,
    setTargetAtTime() {},
  };
}
type AnyNode = MockNode & Record<string, unknown>;

interface MockCtx {
  sources: AnyNode[];
  /** Element đã từng createMediaElementSource — Chrome thật chỉ cho
   * 1 lần / 1 element / 1 context, gọi lại ném InvalidStateError
   * (đo headed C3 R16; ROUND48-D3 sửa mock cho khớp). */
  sourced: Set<object>;
  state: string;
  currentTime: number;
  destination: object;
  createGain(): AnyNode;
  createBiquadFilter(): AnyNode;
  createDynamicsCompressor(): AnyNode;
  createAnalyser(): AnyNode;
  createMediaElementSource(_el: unknown): AnyNode;
  resume(): Promise<void>;
  close(): Promise<void>;
}
function mockCtx(): MockCtx {
  const ctx: MockCtx = {
    sources: [],
    sourced: new Set(),
    state: "running",
    currentTime: 0,
    destination: {},
    createGain() {
      const n = mockNode();
      n["gain"] = mockParam(1);
      return n;
    },
    createBiquadFilter() {
      const n = mockNode();
      n["type"] = "";
      n["frequency"] = mockParam(0);
      n["gain"] = mockParam(0);
      return n;
    },
    createDynamicsCompressor() {
      const n = mockNode();
      n["threshold"] = mockParam(0);
      n["ratio"] = mockParam(1);
      n["attack"] = mockParam(0);
      n["release"] = mockParam(0);
      return n;
    },
    createAnalyser() {
      const n = mockNode();
      n["fftSize"] = 2048;
      n["getByteTimeDomainData"] = () => {};
      return n;
    },
    createMediaElementSource(el: unknown) {
      // ROUND48-D3: khớp Chrome thật — element đã từng được source
      // trong context này thì gọi lại NÉM InvalidStateError (kể cả sau
      // releaseElement đã ngắt + gỡ node khỏi map của engine; release
      // không "quên" element ở tầng AudioContext). Engine bắt lỗi này
      // trong nodeFor() → fallback el.volume (xem audioEngine.ts).
      if (ctx.sourced.has(el as object)) {
        const err = new Error(
          "Failed to execute 'createMediaElementSource' on 'AudioContext': HTMLMediaElement already connected to a MediaElementAudioSourceNode",
        );
        err.name = "InvalidStateError";
        throw err;
      }
      ctx.sourced.add(el as object);
      const n = mockNode();
      ctx.sources.push(n);
      return n;
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

function mockEl(): {
  volume: number;
  muted: boolean;
} {
  return { volume: 1, muted: false };
}

ok("release element lạ (chưa từng update) → false, không ném", () => {
  const ctx = mockCtx();
  const engine = new AudioEngine({
    createContext: () => ctx as unknown as AudioContext,
  });
  assert.equal(engine.ensure(), true);
  const el = mockEl();
  assert.equal(
    engine.releaseElement(el as unknown as HTMLMediaElement),
    false,
  );
  assert.equal(ctx.sources.length, 0);
});

ok("release trước khi ensure (chưa có graph) → false, không ném", () => {
  const engine = new AudioEngine({
    createContext: () => mockCtx() as unknown as AudioContext,
  });
  assert.equal(
    engine.releaseElement(mockEl() as unknown as HTMLMediaElement),
    false,
  );
});

ok("TÁI HIỆN + SỬA (c): update tạo 5 node, release ngắt hết + gỡ khỏi map", () => {
  const ctx = mockCtx();
  const engine = new AudioEngine({
    createContext: () => ctx as unknown as AudioContext,
  });
  assert.equal(engine.ensure(), true);
  const el = mockEl() as unknown as HTMLMediaElement;
  engine.update([{ el, gain: 0.5 }]);
  assert.equal(ctx.sources.length, 1);
  const src = ctx.sources[0]!;
  assert.equal(src.connects, 1);
  // Trước sửa: không có releaseElement nên node cũ nằm lại trong nodes Map
  // (giữ element + graph) cho tới dispose toàn cục. Sau sửa:
  assert.equal(engine.releaseElement(el), true);
  assert.equal(src.disconnects, 1);
  // Release lần 2: đã gỡ khỏi map → false, không disconnect thêm.
  assert.equal(engine.releaseElement(el), false);
  assert.equal(src.disconnects, 1);
});

// ROUND48-D3: test này từng ghi SAI so với Chrome thật (C3 §7):
// Chrome thật gọi lại createMediaElementSource cho cùng element sau
// release và NÉM InvalidStateError (không tạo source mới); engine
// bắt lỗi → fallback el.volume. Mock cũ không ném nên test cũ khóa
// hành vi sai ("sources.length == 2 sau release + update lại").
// Test dưới đây khóa hành vi THẬT (đo headed C3 R16): sau release,
// update lại KHÔNG tạo source mới, gain rơi về el.volume, element
// không còn node trong engine (release lần nữa → false); element MỚI
// vẫn tạo source bình thường.
ok("sau release, update lại KHÔNG tạo source mới (Chrome ném InvalidStateError, gain về el.volume)", () => {
  const ctx = mockCtx();
  const engine = new AudioEngine({
    createContext: () => ctx as unknown as AudioContext,
  });
  assert.equal(engine.ensure(), true);
  const el = mockEl() as unknown as HTMLMediaElement;
  engine.update([{ el, gain: 0.5 }]);
  assert.equal(ctx.sources.length, 1);
  assert.equal(engine.releaseElement(el), true);
  // Update lại cùng element: Chrome ném InvalidStateError khi tạo lại
  // source → engine bắt lỗi, KHÔNG có source mới, gain fallback về el.volume.
  engine.update([{ el, gain: 0.5 }]);
  assert.equal(ctx.sources.length, 1);
  assert.equal((el as unknown as { volume: number }).volume, 0.5);
  // Element đã release + update-lại-thất-bại thì không còn node trong
  // engine: release lần nữa → false (không disconnect thêm).
  assert.equal(engine.releaseElement(el), false);
  // Element MỚI vẫn tạo source bình thường (đúng hành vi production:
  // pool tạo element mới sau drop).
  const el2 = mockEl() as unknown as HTMLMediaElement;
  engine.update([{ el: el2, gain: 0.5 }]);
  assert.equal(ctx.sources.length, 2);
  assert.equal(ctx.sources[1]!.connects, 1);
  assert.equal(engine.releaseElement(el2), true);
});

ok("mock createMediaElementSource gọi lại cùng element → ném InvalidStateError (khớp Chrome thật)", () => {
  const ctx = mockCtx();
  const el = mockEl();
  ctx.createMediaElementSource(el as unknown as HTMLMediaElement);
  assert.throws(
    () => ctx.createMediaElementSource(el as unknown as HTMLMediaElement),
    (e: unknown) => (e as Error).name === "InvalidStateError",
  );
});

ok("release 1 element không đụng element khác còn active", () => {
  const ctx = mockCtx();
  const engine = new AudioEngine({
    createContext: () => ctx as unknown as AudioContext,
  });
  assert.equal(engine.ensure(), true);
  const a = mockEl() as unknown as HTMLMediaElement;
  const b = mockEl() as unknown as HTMLMediaElement;
  engine.update([
    { el: a, gain: 0.5 },
    { el: b, gain: 0.5 },
  ]);
  assert.equal(ctx.sources.length, 2);
  assert.equal(engine.releaseElement(a), true);
  assert.equal(ctx.sources[0]!.disconnects, 1);
  assert.equal(ctx.sources[1]!.disconnects, 0);
  // b vẫn update được bình thường (không bị tạo lại oan).
  engine.update([{ el: b, gain: 0.5 }]);
  assert.equal(ctx.sources.length, 2);
});

console.log(`\naudioEngine44Z2: ${pass} passed`);
