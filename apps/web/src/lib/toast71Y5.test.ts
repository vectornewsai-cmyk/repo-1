// toast71Y5.test.ts — Phase 9 đợt 71, luồng Y5: toast dính (sticky) +
// cập nhật nội dung tại chỗ cho toast trạng thái trial keyframe.
//
// Chạy trực tiếp bằng Node type-stripping (Node 24, từ gốc repo):
//   node apps/web/src/lib/toast71Y5.test.ts
//
// Phạm vi test (toàn hàm thuần, không DOM/React):
// - pushToast thường: không có cờ sticky (hành vi cũ, tự đóng 4,5 s
//   phía component — component chỉ hẹn giờ cho toast không sticky).
// - pushToast sticky: item mang sticky=true.
// - updateToast: đổi message tại chỗ, giữ nguyên id + thứ tự + kind +
//   sticky; cùng nội dung thì không đổi; id lạ trả false, không đổi gì.
// - dismissToast/clearToasts vẫn hoạt động với toast sticky (caller
//   phải tự đóng khi trial xong — không tự đóng).
// Không test component Toasts (cần React/DOM): hành vi "sticky không
// hẹn giờ tự đóng" khóa bằng tsc + vite build + click-test headed.
import assert from "node:assert/strict";
import {
  clearToasts,
  dismissToast,
  pushToast,
  subscribeToasts,
  updateToast,
} from "./toast.ts";

declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

function test(name: string, fn: () => void): void {
  clearToasts();
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

function snapshot(): Array<{ id: number; message: string; kind: string; sticky?: boolean }> {
  let out: Array<{ id: number; message: string; kind: string; sticky?: boolean }> = [];
  const unsub = subscribeToasts((items) => {
    out = items.map((t) => ({ id: t.id, message: t.message, kind: t.kind, sticky: t.sticky }));
  });
  unsub();
  return out;
}

test("pushToast thường không có sticky (hành vi cũ)", () => {
  const id = pushToast("hello", "info");
  const items = snapshot();
  assert.equal(items.length, 1);
  assert.equal(items[0].id, id);
  assert.equal(items[0].message, "hello");
  assert.equal(items[0].sticky, undefined);
});

test("pushToast sticky=true mang cờ sticky", () => {
  const id = pushToast("đang kiểm tra…", "info", { sticky: true });
  const items = snapshot();
  assert.equal(items.length, 1);
  assert.equal(items[0].id, id);
  assert.equal(items[0].sticky, true);
});

test("updateToast đổi message tại chỗ, giữ id/thứ tự/kind/sticky", () => {
  const a = pushToast("đang kiểm tra… 5 giây", "info", { sticky: true });
  const b = pushToast("toast thường", "success");
  assert.equal(updateToast(a, "đang kiểm tra… 6 giây"), true);
  const items = snapshot();
  assert.equal(items.length, 2);
  assert.equal(items[0].id, a);
  assert.equal(items[0].message, "đang kiểm tra… 6 giây");
  assert.equal(items[0].kind, "info");
  assert.equal(items[0].sticky, true);
  assert.equal(items[1].id, b);
  assert.equal(items[1].message, "toast thường");
});

test("updateToast cùng nội dung trả true, không đổi gì", () => {
  const id = pushToast("giữ nguyên", "info", { sticky: true });
  assert.equal(updateToast(id, "giữ nguyên"), true);
  assert.equal(snapshot().length, 1);
});

test("updateToast id lạ trả false, không đổi danh sách", () => {
  pushToast("còn đó", "info");
  assert.equal(updateToast(999999, "không đâu"), false);
  assert.equal(snapshot().length, 1);
  assert.equal(snapshot()[0].message, "còn đó");
});

test("dismissToast đóng được toast sticky; clearToasts dọn hết", () => {
  const id = pushToast("dính", "info", { sticky: true });
  dismissToast(id);
  assert.equal(snapshot().length, 0);
  dismissToast(id); // đóng lại: no-op, không throw
  assert.equal(snapshot().length, 0);
  pushToast("một", "info", { sticky: true });
  pushToast("hai", "error");
  clearToasts();
  assert.equal(snapshot().length, 0);
});

console.log(
  `toast71Y5: ${pass} pass, ${fail} fail${failedNames.length ? ` — FAILED: ${failedNames.join("; ")}` : ""}`,
);
if (fail > 0) process.exitCode = 1;
