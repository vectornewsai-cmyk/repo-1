#!/usr/bin/env node
/**
 * modifyRound51H5.test.ts — Đợt 51 luồng H5: Zod `add_keyframe` chặn
 * Infinity/NaN (nợ F1 §7.5).
 *
 * Trước luồng này: `time: z.number().nonnegative()` cho qua Infinity
 * (Infinity >= 0), `value: z.number()` cho qua cả Infinity lẫn NaN.
 * Infinity vào keyframes sẽ bị `normalizeKeyframes` lọc ở panel nhưng
 * `validateVideoSpec` từ chối ở lần save sau — chặn ngay ở schema.
 *
 * Test schema thật (export `addKeyframeInputSchema` từ modify.ts), không
 * mock kết quả: safeParse phải fail với time/value Infinity/NaN và pass
 * với giá trị hữu hạn hợp lệ; các ràng buộc cũ (time âm, easing lạ)
 * vẫn fail như trước.
 *
 * Chạy (từ mcp-server/): npm run build && node dist/mcp-server/src/tools/modifyRound51H5.test.js
 * (strip-types trực tiếp không resolve được import "./modify.js" → "./modify.ts"
 * trên Node của VM này — cả test roundtrip.test.ts có sẵn cũng lỗi y hệt —
 * nên chạy qua bản build tsc như cách chạy thật của MCP server.)
 */
import { z } from "zod";
import { addKeyframeInputSchema } from "./modify.js";

declare const process: { exitCode: number | undefined };

const schema = z.object(addKeyframeInputSchema);

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function assertOk(input: unknown, msg: string): void {
  const r = schema.safeParse(input);
  if (!r.success) throw new Error(`${msg} — schema từ chối input hợp lệ: ${r.error.message}`);
}

function assertReject(input: unknown, msg: string): void {
  const r = schema.safeParse(input);
  if (r.success) throw new Error(`${msg} — schema chấp nhận input phải chặn`);
}

const base = { project_id: "p1", clip_id: "c1", property: "x", time: 1, value: 0.5 };

test("hợp lệ: time/value hữu hạn → pass", () => {
  assertOk(base, "base");
  assertOk({ ...base, time: 0, value: 0, easing: "ease-in" }, "biên 0");
});

test("time = Infinity → chặn", () => {
  assertReject({ ...base, time: Infinity }, "time Infinity");
});

test("time = -Infinity → chặn", () => {
  assertReject({ ...base, time: -Infinity }, "time -Infinity");
});

test("time = NaN → chặn", () => {
  assertReject({ ...base, time: NaN }, "time NaN");
});

test("value = Infinity → chặn", () => {
  assertReject({ ...base, value: Infinity }, "value Infinity");
});

test("value = -Infinity → chặn", () => {
  assertReject({ ...base, value: -Infinity }, "value -Infinity");
});

test("value = NaN → chặn", () => {
  assertReject({ ...base, value: NaN }, "value NaN");
});

test("ràng buộc cũ giữ nguyên: time âm → chặn, easing lạ → chặn", () => {
  assertReject({ ...base, time: -1 }, "time âm");
  assertReject({ ...base, easing: "bounce" }, "easing lạ");
});

console.log(`\nmodifyRound51H5: ${pass} pass, ${fail} fail.`);
if (fail > 0) {
  console.error(`FAIL: ${failedNames.join("; ")}`);
  process.exitCode = 1;
}
