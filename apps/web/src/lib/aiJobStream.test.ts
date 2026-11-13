// aiJobStream.test.ts — Đợt 80 H8 (gap N4): test đọc NDJSON stream job AI dài.
//
// Chạy từ gốc repo (bundle ra scratch ngoài repo, giống mẫu P7):
//   ./node_modules/esbuild/bin/esbuild apps/web/src/lib/aiJobStream.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round80-h8/aiJobStream.test.cjs \
//     && node /tmp/round80-h8/aiJobStream.test.cjs
//
// Kiểm chứng (không cần bridge thật — Response giả lập bằng ReadableStream):
//   [1] parse phase + progress (kể cả chunk cắt giữa dòng) + done payload
//   [2] dòng rác / không phải JSON bị bỏ qua, không fail luồng
//   [3] event "cancelled" → AiJobCancelledError
//   [4] event "error" → Error giữ bridgeBody (errorCode cho resolveBridgeApiError)
//   [5] stream hết mà không có "done" → Error(AI_JOB_STREAM_DROPPED)
//   [6] type lạ → bỏ qua (tương thích tiến)
//   [7] formatAiJobEta: giây / phút+giây / giờ / null-NaN-âm → ""
//   [8] resolveAiJobPhaseLabel: đủ 10 phase bridge gửi + phase lạ → phaseProcessing
import assert from "node:assert/strict";
import {
  AI_JOB_STREAM_DROPPED,
  AiJobCancelledError,
  formatAiJobEta,
  readAiJobStream,
  resolveAiJobPhaseLabel,
  type AiJobDonePayload,
  type AiJobProgressState,
} from "./aiJobStream";

let pass = 0;
let fail = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}

/** Response giả lập: body là ReadableStream phát các chunk string cho trước. */
function fakeResponse(chunks: string[]): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
  return { body: stream } as unknown as Response;
}

/** Lookup stub: trả "key{vars}" để test thấy đúng key + đúng vars. */
const stubLookup = (key: string, vars?: Record<string, string>): string =>
  vars ? `${key}[${Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(",")}]` : key;

ok("parse: phase + progress + done, chunk cắt giữa dòng", async () => {
  const phases: Array<[string, string | undefined]> = [];
  const progs: AiJobProgressState[] = [];
  const done = await readAiJobStream(
    fakeResponse([
      '{"type":"phase","phase":"load","message":"nạp',
      ' model"}\n{"type":"progress","phase":"transcribe","progress":0.25,',
      '"done":15,"total":60,"etaSeconds":45}\n{"type":"progress","phase":"transcribe","progress":null,"done":null,"total":null,"etaSeconds":null}\n{"type":"done","segments":2,"downloadUrl":"/api/ai-download/abcdef0123456789"}\n',
    ]),
    {
      onPhase: (p, m) => phases.push([p, m]),
      onProgress: (p) => progs.push(p),
    },
  );
  assert.deepEqual(phases, [["load", "nạp model"]]);
  assert.equal(progs.length, 2);
  assert.equal(progs[0].progress, 0.25);
  assert.equal(progs[0].etaSeconds, 45);
  assert.equal(progs[1].progress, null); // total chưa biết → null, không bịa %
  assert.equal(progs[1].etaSeconds, null);
  assert.equal((done as AiJobDonePayload).downloadUrl, "/api/ai-download/abcdef0123456789");
  assert.equal((done as unknown as { segments: number }).segments, 2);
});

ok("parse: dòng rác + dòng trống bị bỏ qua, luồng vẫn xong", async () => {
  const done = await readAiJobStream(
    fakeResponse([
      'not-json\n\n{"type":"phase","phase":"load"}\n',
      '{"type":"progress","phase":"synth","progress":0.5,"etaSeconds":10}\n',
      '{bad json\n{"type":"done"}\n',
    ]),
  );
  assert.equal(done.type, "done");
});

ok("cancelled: event cancelled → AiJobCancelledError", async () => {
  await assert.rejects(
    readAiJobStream(
      fakeResponse([
        '{"type":"phase","phase":"load"}\n{"type":"cancelled"}\n',
      ]),
    ),
    (e: unknown) => e instanceof AiJobCancelledError && (e as Error).message === "AI_JOB_CANCELLED",
  );
});

ok("error: event error → Error giữ bridgeBody cho resolveBridgeApiError", async () => {
  let caught: unknown;
  try {
    await readAiJobStream(
      fakeResponse([
        '{"type":"error","error":"lỗi python","errorCode":"AI_JOB_FAILED","detail":"x"}\n',
      ]),
    );
  } catch (e) {
    caught = e;
  }
  assert.ok(caught instanceof Error);
  assert.equal((caught as Error).message, "lỗi python");
  const body = (caught as Error & { bridgeBody?: { errorCode?: string } }).bridgeBody;
  assert.equal(body?.errorCode, "AI_JOB_FAILED");
});

ok("dropped: stream hết không có done → AI_JOB_STREAM_DROPPED", async () => {
  await assert.rejects(
    readAiJobStream(
      fakeResponse(['{"type":"phase","phase":"load"}\n']),
    ),
    (e: unknown) => e instanceof Error && (e as Error).message === AI_JOB_STREAM_DROPPED,
  );
});

ok("parse: type lạ bị bỏ qua (tương thích tiến)", async () => {
  const done = await readAiJobStream(
    fakeResponse([
      '{"type":"heartbeat","at":123}\n{"type":"done","ok":true}\n',
    ]),
  );
  assert.equal((done as unknown as { ok: boolean }).ok, true);
});

ok("formatAiJobEta: giây / phút+giây / giờ / null-NaN-âm", () => {
  assert.equal(formatAiJobEta(45, stubLookup), "aiJob.etaSeconds[seconds=45]");
  assert.equal(formatAiJobEta(130, stubLookup), "aiJob.etaMinutes[minutes=2,seconds=10]");
  assert.equal(formatAiJobEta(60, stubLookup), "aiJob.etaMinutes[minutes=1,seconds=0]");
  assert.equal(formatAiJobEta(3599, stubLookup), "aiJob.etaMinutes[minutes=59,seconds=59]");
  // Đợt 81 I6: nhánh giờ cho job dài (bgremove/reframe video dài).
  assert.equal(formatAiJobEta(3600, stubLookup), "aiJob.etaHours[hours=1,minutes=0]");
  assert.equal(formatAiJobEta(3661, stubLookup), "aiJob.etaHours[hours=1,minutes=1]");
  assert.equal(formatAiJobEta(7320, stubLookup), "aiJob.etaHours[hours=2,minutes=2]");
  assert.equal(formatAiJobEta(null, stubLookup), "");
  assert.equal(formatAiJobEta(undefined, stubLookup), "");
  assert.equal(formatAiJobEta(Number.NaN, stubLookup), "");
  assert.equal(formatAiJobEta(-5, stubLookup), "aiJob.etaSeconds[seconds=0]");
});

ok("resolveAiJobPhaseLabel: đủ 10 phase + phase lạ → phaseProcessing", () => {
  const cases: Array<[string, string]> = [
    ["load", "aiJob.phaseLoad"],
    ["synth", "aiJob.phaseSynth"],
    ["processing", "aiJob.phaseProcessing"],
    ["fallback", "aiJob.phaseFallback"],
    ["extract", "aiJob.phaseExtract"],
    ["group", "aiJob.phaseGroup"],
    ["scan", "aiJob.phaseScan"],
    ["upload", "aiJob.phaseUpload"],
    ["transcribe", "aiJob.phaseTranscribe"],
    ["translating", "aiJob.phaseTranslating"],
    ["weird-phase-xyz", "aiJob.phaseProcessing"],
    ["", "aiJob.phaseProcessing"],
  ];
  for (const [phase, key] of cases) {
    assert.equal(resolveAiJobPhaseLabel(phase, stubLookup), key, `phase ${phase}`);
  }
});

async function main(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      fail++;
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
    }
  }
  console.log(`aiJobStream (đợt 80 H8): ${pass} pass, ${fail} fail`);
  process.exitCode = fail === 0 ? 0 : 1;
}

void main();
