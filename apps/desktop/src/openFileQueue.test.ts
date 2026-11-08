/**
 * openFileQueue.test.ts — unit test cho openFileQueue.ts (đợt 54 K4, D1 argv).
 *
 * Chạy (không cần Electron — module thuần):
 *   node_modules/.bin/esbuild --bundle --platform=node --format=esm \
 *     --outfile=/tmp/open-file-queue.test.mjs src/openFileQueue.test.ts \
 *     && node --test /tmp/open-file-queue.test.mjs
 * (chạy từ apps/desktop; esbuild có sẵn ở repo root node_modules/.bin)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { OpenFileQueue } from "./openFileQueue";

test("push trước subscribe: subscriber đầu tiên nhận đủ, đúng thứ tự, hàng đợi xóa", () => {
  const q = new OpenFileQueue();
  q.push("/a/mot.vcut");
  q.push("/a/hai.vcut");
  assert.equal(q.pendingCount, 2);
  const got: string[] = [];
  q.subscribe((p) => got.push(p));
  assert.deepEqual(got, ["/a/mot.vcut", "/a/hai.vcut"]);
  assert.equal(q.pendingCount, 0);
});

test("push sau subscribe: giao ngay cho subscriber đang nghe", () => {
  const q = new OpenFileQueue();
  const got: string[] = [];
  q.subscribe((p) => got.push(p));
  q.push("/a/ba.vcut");
  assert.deepEqual(got, ["/a/ba.vcut"]);
  assert.equal(q.pendingCount, 0);
});

test("subscriber thứ hai không nhận lại hàng đợi đã xả (không mở file 2 lần)", () => {
  const q = new OpenFileQueue();
  q.push("/a/mot.vcut");
  const first: string[] = [];
  const second: string[] = [];
  q.subscribe((p) => first.push(p));
  q.subscribe((p) => second.push(p));
  assert.deepEqual(first, ["/a/mot.vcut"]);
  assert.deepEqual(second, []);
  // Event mới sau đó thì cả hai đều nhận (live broadcast).
  q.push("/a/hai.vcut");
  assert.deepEqual(first, ["/a/mot.vcut", "/a/hai.vcut"]);
  assert.deepEqual(second, ["/a/hai.vcut"]);
});

test("huỷ đăng ký: không nhận event nữa; event tới lúc không còn ai nghe thì vào hàng đợi", () => {
  const q = new OpenFileQueue();
  const got: string[] = [];
  const off = q.subscribe((p) => got.push(p));
  q.push("/a/mot.vcut");
  assert.deepEqual(got, ["/a/mot.vcut"]);
  off();
  q.push("/a/hai.vcut");
  assert.deepEqual(got, ["/a/mot.vcut"]);
  assert.equal(q.pendingCount, 1);
  const late: string[] = [];
  q.subscribe((p) => late.push(p));
  assert.deepEqual(late, ["/a/hai.vcut"]);
});
