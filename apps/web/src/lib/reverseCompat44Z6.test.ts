// reverseCompat44Z6.test.ts — Phase 9 đợt 44, luồng Z6: tiếp nối audit
// compat Y6 (đợt 43), đóng 4 nợ Y6 §7: badge qua i18n, badge = đường
// đã chọn, guard importFiles ở mức runtime app-level (phần này đo bằng
// script headed riêng, xem LIMITS Z6 — file test Node này KHÔNG mạo
// nhận mình là app-level), probe isConfigSupported trước configure.
//
// Chạy bằng esbuild bundle (lý do như Y6: reverseWebcodecs.ts import
// "./mp4Demux" không đuôi nên Node strip-types không resolve được):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseCompat44Z6.test.ts \
//     --bundle --platform=node --format=cjs --outfile=<scratch>/z6.test.cjs \
//     && node <scratch>/z6.test.cjs
// (chạy từ gốc repo; bundle ra scratch ngoài repo, KHÔNG ra /tmp,
// KHÔNG ra dist.)
//
// Phạm vi Node: logic thuần + fake global — KHÔNG mạo nhận là
// Safari/Firefox/máy thật. Bằng chứng browser thật nằm ở script headed
// clicktest-round44-z6-compat-pipe.mjs (importFiles IDB vắng + badge
// qua i18n trên Chromium thật).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  resolveReverseEngineBadge,
  resolveReverseEngineDetailed,
  reverseEngineMissingApi,
} from "./reversePlayback.ts";
import { ReverseFrameCache } from "./reverseWebcodecs.ts";

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`Z6 compat: ${pass}/${queue.length} pass`);
}

const g = globalThis as unknown as Record<string, unknown>;

// --- 1. i18n: badge engine đã qua hệ i18n, vi/en phẳng đủ key --------
function flatten(o: unknown, prefix: string, out: Set<string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.add(q);
  }
}
function dict(lang: string): { keys: Set<string>; raw: Record<string, unknown> } {
  const raw = JSON.parse(
    readFileSync(`apps/web/src/i18n/${lang}.json`, "utf8"),
  ) as Record<string, unknown>;
  const keys = new Set<string>();
  flatten(raw, "", keys);
  return { keys, raw };
}
function lookup(dictRaw: Record<string, unknown>, key: string): string {
  let cur: unknown = dictRaw;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
  return cur as string;
}

ok("i18n: vi/en phẳng đủ key, bằng nhau, có 4 key reverseEngine mới", () => {
  const vi = dict("vi");
  const en = dict("en");
  assert.equal(vi.keys.size, en.keys.size);
  for (const k of vi.keys) assert.ok(en.keys.has(k), `en thiếu key ${k}`);
  for (const k of en.keys) assert.ok(vi.keys.has(k), `vi thiếu key ${k}`);
  for (const k of [
    "reverseEngine.badgeWebcodecs",
    "reverseEngine.badgeElementMissing",
    "reverseEngine.titleWebcodecs",
    "reverseEngine.titleElementMissing",
  ]) {
    assert.ok(vi.keys.has(k), `vi thiếu ${k}`);
    assert.ok(en.keys.has(k), `en thiếu ${k}`);
  }
  // Số mới sau Z6 (đợt 42: 962/962; Z6 thêm đúng 4 key mỗi bên).
  // ROUND46-B6 cập nhật duy nhất số này: B6 thêm đúng 2 key mỗi bên
  // (badgeElementFailed/titleElementFailed) nên 966 -> 968, +3 key D4 -> 971, +2 key E2 -> 973; logic
  // test Z6 không đổi. Nếu luồng khác cùng đợt cũng thêm key,
  // parent gộp cập nhật lại số này theo tổng thực tế.
  assert.equal(vi.keys.size, 973);
  assert.equal(en.keys.size, 973);
});

ok("i18n: chuỗi badge đã dời từ hardcode preview.tsx sang dict (vi/en)", () => {
  const vi = dict("vi").raw;
  const en = dict("en").raw;
  assert.equal(lookup(vi, "reverseEngine.badgeWebcodecs"), "◀ NGƯỢC: WEBCODECS");
  assert.equal(lookup(en, "reverseEngine.badgeWebcodecs"), "◀ REVERSE: WEBCODECS");
  // Placeholder {api} còn nguyên ở cả 2 ngôn ngữ để caller thay tên API.
  assert.ok(
    lookup(vi, "reverseEngine.badgeElementMissing").includes("{api}"),
    "vi badgeElementMissing mất {api}",
  );
  assert.ok(
    lookup(en, "reverseEngine.badgeElementMissing").includes("{api}"),
    "en badgeElementMissing mất {api}",
  );
  assert.ok(
    lookup(vi, "reverseEngine.titleElementMissing").includes("{api}"),
    "vi titleElementMissing mất {api}",
  );
  assert.ok(
    lookup(en, "reverseEngine.titleElementMissing").includes("{api}"),
    "en titleElementMissing mất {api}",
  );
});

// --- 2. Badge = đường đã chọn, KHÔNG phải đường vẽ từng frame -------
ok("badge: đường đã chọn webcodecs + stepping -> webcodecs", () => {
  const b = resolveReverseEngineBadge(
    { engine: "webcodecs", reason: "webcodecs-ok" },
    true,
  );
  assert.deepEqual(b, { kind: "webcodecs", missingApi: null });
});

ok("badge LỆCH CŨ nay đúng: frame vẽ bằng fallback element nhưng đường đã chọn là webcodecs -> badge vẫn WEBCODECS", () => {
  // Mô hình logic CŨ (suy từ frame vừa vẽ — chỉ dùng trong test này để
  // đối chiếu, không phải code repo): frame vẽ bằng element => badge
  // ELEMENT, dù đường đã chọn là webcodecs. Đó chính là lệch mà Z6 sửa.
  const drawnVia: "webcodecs" | "element" = "element"; // frame fallback
  const oldFrameInferred =
    drawnVia === "webcodecs" ? "webcodecs" : "element-missing";
  assert.equal(oldFrameInferred, "element-missing"); // logic cũ cho ra sai
  // Logic MỚI: hàm thuần không nhận frame vừa vẽ — chỉ nhận đường đã
  // chọn + stepping — nên cùng tình huống này cho ra đúng.
  const b = resolveReverseEngineBadge(
    resolveReverseEngineDetailed(true, {
      videoDecoder: true,
      encodedVideoChunk: true,
      videoFrame: true,
    }),
    true,
  );
  assert.deepEqual(b, { kind: "webcodecs", missingApi: null });
});

ok("badge: đường đã chọn element (thiếu từng API) -> đúng tên API thiếu", () => {
  const cases: Array<{
    caps: { videoDecoder: boolean; encodedVideoChunk: boolean; videoFrame: boolean };
    api: string;
  }> = [
    {
      caps: { videoDecoder: false, encodedVideoChunk: true, videoFrame: true },
      api: "VideoDecoder",
    },
    {
      caps: { videoDecoder: true, encodedVideoChunk: false, videoFrame: true },
      api: "EncodedVideoChunk",
    },
    {
      caps: { videoDecoder: true, encodedVideoChunk: true, videoFrame: false },
      api: "VideoFrame",
    },
  ];
  for (const c of cases) {
    const b = resolveReverseEngineBadge(
      resolveReverseEngineDetailed(true, c.caps),
      true,
    );
    assert.deepEqual(b, { kind: "element-missing", missingApi: c.api });
  }
  assert.equal(reverseEngineMissingApi("webcodecs-ok"), null);
  assert.equal(reverseEngineMissingApi("opt-in-off"), null);
});

ok("badge: không stepping hoặc opt-in tắt -> null (badge ẩn)", () => {
  assert.equal(
    resolveReverseEngineBadge(
      { engine: "webcodecs", reason: "webcodecs-ok" },
      false,
    ),
    null,
  );
  assert.equal(
    resolveReverseEngineBadge({ engine: "element", reason: "opt-in-off" }, true),
    null,
  );
});

// --- 3. Probe isConfigSupported trước configure -----------------------
function fakeTrackAndSamples(): {
  track: unknown;
  samples: unknown[];
  getData: (s: unknown) => Promise<Uint8Array>;
} {
  const track = {
    codec: "avc1.64001F",
    width: 64,
    height: 64,
    description: undefined,
    timescale: 1000,
  };
  const samples = [
    {
      index: 0,
      isKey: true,
      timestamp: 0,
      presentationTimestamp: 0,
      duration: 1000,
      offset: 0,
      size: 4,
    },
  ];
  return {
    track,
    samples,
    getData: async () => new Uint8Array([0, 0, 0, 1]),
  };
}

async function runDecodeGop(): Promise<number> {
  const cache = new ReverseFrameCache();
  const { track, samples, getData } = fakeTrackAndSamples();
  return (cache as unknown as {
    decodeGop: (
      t: unknown,
      s: unknown[],
      from: number,
      to: number,
      get: (s: unknown) => Promise<Uint8Array>,
      preferHardware?: boolean,
    ) => Promise<number>;
  }).decodeGop(track, samples, 0, 0, getData, true);
}

ok("probe: isConfigSupported=false -> trả 0 mà KHÔNG dựng decoder", async () => {
  const saved = g["VideoDecoder"];
  const savedChunk = g["EncodedVideoChunk"];
  let constructed = 0;
  try {
    g["VideoDecoder"] = class {
      constructor() {
        constructed++;
      }
      static async isConfigSupported(): Promise<{ supported: boolean }> {
        return { supported: false };
      }
      configure(): void {}
      decode(): void {}
      async flush(): Promise<void> {}
      close(): void {}
    };
    g["EncodedVideoChunk"] = class {
      constructor(init: unknown) {
        void init;
      }
    };
    const n = await runDecodeGop();
    assert.equal(n, 0);
    assert.equal(constructed, 0);
  } finally {
    if (saved === undefined) delete g["VideoDecoder"];
    else g["VideoDecoder"] = saved;
    if (savedChunk === undefined) delete g["EncodedVideoChunk"];
    else g["EncodedVideoChunk"] = savedChunk;
  }
});

ok("probe: API vắng -> bỏ qua probe, đi đường configure cũ (constructor chạy)", async () => {
  const saved = g["VideoDecoder"];
  const savedChunk = g["EncodedVideoChunk"];
  let constructed = 0;
  let configured = 0;
  try {
    // Fake KHÔNG có static isConfigSupported — đúng nhánh fallback.
    g["VideoDecoder"] = class {
      constructor() {
        constructed++;
      }
      configure(): void {
        configured++;
      }
      decode(): void {}
      async flush(): Promise<void> {}
      close(): void {}
    };
    assert.equal(
      typeof (g["VideoDecoder"] as unknown as { isConfigSupported?: unknown })
        .isConfigSupported,
      "undefined",
    );
    g["EncodedVideoChunk"] = class {
      constructor(init: unknown) {
        void init;
      }
    };
    const n = await runDecodeGop();
    assert.equal(n, 0); // không frame output từ fake, nhưng decoder đã dựng
    assert.equal(constructed, 1);
    assert.equal(configured, 1);
  } finally {
    if (saved === undefined) delete g["VideoDecoder"];
    else g["VideoDecoder"] = saved;
    if (savedChunk === undefined) delete g["EncodedVideoChunk"];
    else g["EncodedVideoChunk"] = savedChunk;
  }
});

ok("probe: supported=true -> dựng + configure, probe nhận đúng config prefer-hardware", async () => {
  const saved = g["VideoDecoder"];
  const savedChunk = g["EncodedVideoChunk"];
  let constructed = 0;
  let configured = 0;
  let probedConfig: Record<string, unknown> | null = null;
  try {
    g["VideoDecoder"] = class {
      constructor() {
        constructed++;
      }
      static async isConfigSupported(
        cfg: Record<string, unknown>,
      ): Promise<{ supported: boolean }> {
        probedConfig = cfg;
        return { supported: true };
      }
      configure(): void {
        configured++;
      }
      decode(): void {}
      async flush(): Promise<void> {}
      close(): void {}
    };
    g["EncodedVideoChunk"] = class {
      constructor(init: unknown) {
        void init;
      }
    };
    const n = await runDecodeGop();
    assert.equal(n, 0); // fake không output frame, chỉ chứng minh đi tiếp
    assert.equal(constructed, 1);
    assert.equal(configured, 1);
    assert.equal(probedConfig?.["codec"], "avc1.64001F");
    assert.equal(probedConfig?.["hardwareAcceleration"], "prefer-hardware");
  } finally {
    if (saved === undefined) delete g["VideoDecoder"];
    else g["VideoDecoder"] = saved;
    if (savedChunk === undefined) delete g["EncodedVideoChunk"];
    else g["EncodedVideoChunk"] = savedChunk;
  }
});

ok("probe: isConfigSupported throw -> rơi xuống configure, không đoán unsupported", async () => {
  const saved = g["VideoDecoder"];
  const savedChunk = g["EncodedVideoChunk"];
  let constructed = 0;
  try {
    g["VideoDecoder"] = class {
      constructor() {
        constructed++;
      }
      static async isConfigSupported(): Promise<{ supported: boolean }> {
        throw new Error("probe lỗi (giả lập)");
      }
      configure(): void {}
      decode(): void {}
      async flush(): Promise<void> {}
      close(): void {}
    };
    g["EncodedVideoChunk"] = class {
      constructor(init: unknown) {
        void init;
      }
    };
    const n = await runDecodeGop();
    assert.equal(n, 0);
    assert.equal(constructed, 1); // đã rơi xuống configure, không trả 0 sớm
  } finally {
    if (saved === undefined) delete g["VideoDecoder"];
    else g["VideoDecoder"] = saved;
    if (savedChunk === undefined) delete g["EncodedVideoChunk"];
    else g["EncodedVideoChunk"] = savedChunk;
  }
});

void runAll();
