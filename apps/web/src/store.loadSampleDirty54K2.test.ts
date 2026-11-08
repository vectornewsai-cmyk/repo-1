/**
 * store.loadSampleDirty54K2.test.ts — Test qua store thật, Phase 9 đợt 54
 * (luồng K2, bug D4 exit 127 sau forward — đợt 53 J4 §6).
 *
 * BUG: project mẫu do loadSample() sinh ra bị isDirty() = true NGAY TỪ
 * LÚC SINH RA — vì lastSavedHash còn null (chưa từng markSaved) mà
 * spec có tracks (projectRepo.ts isDirty: null → tracks.length > 0).
 * Hậu quả: mọi lần mở file ngoài (double-click .vcut / recent / argv)
 * khi app đang chạy đều bật window.confirm "Có thay đổi chưa lưu..."
 * và chặn renderer ngay giữa flow forward của second-instance
 * (D4c đợt 53: dialog mở, menu bar trắng, click Thoát fail).
 *
 * FIX (store.ts loadSample): markSaved(spec) sau khi set() thành công.
 *
 * VÌ SAO FILE NÀY KHÔNG CHẠY BẰNG `node` TRỰC TIẾP: như
 * store.nestedGuard.test.ts — store.ts dùng import không đuôi mở rộng
 * mà chỉ Vite mới phân giải. Chạy bằng esbuild bundle trước rồi chạy:
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.loadSampleDirty54K2.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.loadSampleDirty54K2.test.cjs --log-level=warning
 *   node /tmp/store.loadSampleDirty54K2.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4: validate.js dùng dynamic require.)
 *
 * RED-BEFORE: bỏ dòng markSaved(spec) trong loadSample (store.ts) rồi
 * chạy lại — K1 FAIL (isDirty = true ngay sau loadSample), K3 FAIL;
 * K2 vẫn PASS (đổi tên luôn dirty). Ghi lại được khi viết test.
 *
 * NỘI DUNG:
 *  K1. loadSample() → isDirty(spec) === false (project mẫu mới load
 *      chưa có thay đổi của user thì không dirty).
 *  K2. Sau K1, đổi tên project → isDirty(spec) === true (markSaved
 *      không đóng băng cờ dirty; sửa thật vẫn dirty trở lại).
 *  K3. loadSample() lại → isDirty(spec) === false (đánh dấu lại mỗi
 *      lần load, không chỉ lần đầu).
 */

import { useStore } from "./store";
import { isDirty } from "./lib/projectRepo";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

/* --- Shim DOM tối thiểu cho buildSampleProject() trong Node ---
 * recordSample() trả null ngay vì MediaRecorder undefined → đi nhánh
 * stillSample(): chỉ cần document.createElement("canvas") với ctx 2d
 * stub (mọi phương thức vẽ no-op) + toDataURL trả PNG 1x1 hợp lệ.
 * AssetStore (IndexedDB) ném lỗi trong Node nhưng buildSampleProject
 * đã try/catch best-effort nên mẫu vẫn chạy được. */
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const ctxStub = new Proxy(
  {},
  {
    get: (_t, p) => {
      if (p === "createLinearGradient") return () => ({ addColorStop() {} });
      return () => {};
    },
  },
);
const canvasStub = {
  width: 0,
  height: 0,
  getContext: () => ctxStub,
  toDataURL: () => PNG_1X1,
};
(globalThis as Record<string, unknown>).document = {
  createElement: () => canvasStub,
};

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failedNames.push(name);
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

async function main(): Promise<void> {
  console.log("== K1. loadSample() → không dirty ==");
  await test("K1: project mẫu vừa load thì isDirty = false", async () => {
    await useStore.getState().loadSample();
    eq(useStore.getState().spec.meta.name, "Dự án mẫu", "tên project mẫu");
    eq(isDirty(useStore.getState().spec), false, "isDirty sau loadSample");
  });

  console.log("== K2. sửa thật → dirty trở lại ==");
  await test("K2: đổi tên project sau loadSample thì isDirty = true", () => {
    useStore.setState((s) => ({
      spec: { ...s.spec, meta: { ...s.spec.meta, name: "Đã sửa" } },
    }));
    eq(isDirty(useStore.getState().spec), true, "isDirty sau khi đổi tên");
  });

  console.log("== K3. loadSample() lại → không dirty ==");
  await test("K3: loadSample lần 2 thì isDirty = false", async () => {
    await useStore.getState().loadSample();
    eq(useStore.getState().spec.meta.name, "Dự án mẫu", "tên project mẫu sau load lại");
    eq(isDirty(useStore.getState().spec), false, "isDirty sau loadSample lần 2");
  });

  console.log(
    `\nstore.loadSampleDirty54K2: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
