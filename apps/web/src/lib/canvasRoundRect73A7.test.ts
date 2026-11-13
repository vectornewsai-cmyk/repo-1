/**
 * canvasRoundRect73A7.test.ts — Phase 9 đợt 73, luồng A7: fallback
 * `roundRect` cho Safari < 16 (xem apps/web/src/lib/canvasRoundRect.ts).
 *
 * Khóa bằng mock ctx thuần (không cần DOM/trình duyệt — chứng minh được
 * trên Node/Chromium):
 *  - ctx có roundRect → gọi đúng roundRect với đủ 5 tham số, không gọi rect.
 *  - ctx KHÔNG có roundRect (mô phỏng Safari < 16) → gọi rect thay thế,
 *    không ném; beginPath vẫn gọi trước trong cả 2 đường.
 *  - ctx.roundRect tồn tại nhưng không phải function → cũng rơi về rect.
 *
 * Chạy (từ gốc repo): node --experimental-strip-types apps/web/src/lib/canvasRoundRect73A7.test.ts
 * Thêm file này vào exclude của apps/web/tsconfig.json theo quy ước test.
 */
import assert from "node:assert/strict";
import { pathRoundRect } from "./canvasRoundRect.ts";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

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

type Calls = { beginPath: number; roundRect: Array<unknown[]>; rect: Array<unknown[]> };

function mockCtx(withRoundRect: boolean | "not-a-function"): { ctx: unknown; calls: Calls } {
  const calls: Calls = { beginPath: 0, roundRect: [], rect: [] };
  const ctx: Record<string, unknown> = {
    beginPath: () => {
      calls.beginPath++;
    },
    rect: (...args: unknown[]) => {
      calls.rect.push(args);
    },
  };
  if (withRoundRect === true) {
    ctx["roundRect"] = (...args: unknown[]) => {
      calls.roundRect.push(args);
    };
  } else if (withRoundRect === "not-a-function") {
    ctx["roundRect"] = 42;
  }
  return { ctx, calls };
}

test("có roundRect → dùng roundRect đúng tham số, không gọi rect", () => {
  const { ctx, calls } = mockCtx(true);
  pathRoundRect(ctx as unknown as CanvasRenderingContext2D, -10, -5, 100, 40, 10);
  assert.equal(calls.beginPath, 1);
  assert.deepEqual(calls.roundRect, [[-10, -5, 100, 40, 10]]);
  assert.deepEqual(calls.rect, []);
});

test("không có roundRect (Safari < 16) → rơi về rect, không ném", () => {
  const { ctx, calls } = mockCtx(false);
  pathRoundRect(ctx as unknown as CanvasRenderingContext2D, 0, 0, 50, 20, 10);
  assert.equal(calls.beginPath, 1);
  assert.deepEqual(calls.roundRect, []);
  assert.deepEqual(calls.rect, [[0, 0, 50, 20]]);
});

test("roundRect tồn tại nhưng không phải function → rơi về rect", () => {
  const { ctx, calls } = mockCtx("not-a-function");
  pathRoundRect(ctx as unknown as CanvasRenderingContext2D, 1, 2, 3, 4, 5);
  assert.equal(calls.beginPath, 1);
  assert.deepEqual(calls.roundRect, []);
  assert.deepEqual(calls.rect, [[1, 2, 3, 4]]); // rect chỉ nhận 4 tham số (x, y, w, h) — r bị bỏ
});

console.log(`\ncanvasRoundRect73A7: ${pass} pass, ${fail} fail${fail > 0 ? ` — FAILED: ${failedNames.join(", ")}` : ""}`);
if (fail > 0) process.exitCode = 1;
