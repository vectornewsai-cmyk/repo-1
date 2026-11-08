/**
 * store.undoAfterNew55L5.test.ts — Test qua store thật, Phase 9 đợt 55
 * (luồng L5, nợ M10/M12–M15 từ đợt 54 K4 §3).
 *
 * BUG: sau "Dự án mới" (M9: clip về 0, PASS), bấm Undo (M10) KHÔNG khôi
 * phục clip (clip vẫn 0) → M12–M15 không có clip để thao tác
 * (copy/paste/cut/duplicate/select-all đều tới renderer nhưng không có
 * gì để làm). Nguyên nhân gốc: `newProject()` trong store.ts gọi
 * `clearHistory()` — xoá sạch undo stack nên `undoDepth` = 0 và `undo()`
 * là no-op. Không liên quan dialog/D1, và `isDirty`/`markSaved` cũng
 * không chặn undo (undo không đọc cờ dirty — xem LIMITS §2).
 *
 * FIX (store.ts `newProject` + lib/commands.ts
 * `CommandStack.resetWithTransition`): trước khi đổi sang project trống,
 * ghi đúng 1 entry chuyển đổi (before = spec cũ, after = spec trống,
 * label "Dự án mới") rồi xoá history cũ hơn. Undo 1 lần khôi phục đúng
 * project trước đó (đủ clip + timeline + selection); redo quay lại
 * project trống; undo lần 2 không còn gì (không undo xuyên qua nhiều
 * project — giữ quy ước cũ của `clearHistory`).
 *
 * VÌ SAO FILE NÀY KHÔNG CHẠY BẰNG `node` TRỰC TIẾP: như
 * store.nestedGuard.test.ts — store.ts dùng import không đuôi mở rộng
 * mà chỉ Vite mới phân giải. Chạy bằng esbuild bundle trước rồi chạy:
 *
 *   cd <gốc repo>
 *   node_modules/.bin/esbuild apps/web/src/store.undoAfterNew55L5.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/store.undoAfterNew55L5.test.cjs --log-level=warning
 *   node /tmp/store.undoAfterNew55L5.test.cjs
 * (Bắt buộc --format=cjs, lý do như T4: validate.js dùng dynamic require.)
 *
 * RED-BEFORE: chạy trên code chưa sửa — U1 FAIL (undoDepth = 0 sau
 * newProject, undo không khôi phục clip), U2 FAIL (không có clip để
 * copy/paste/duplicate), U5 FAIL (undo không khôi phục cả clip vừa
 * thêm). U3/U4/U6 PASS cả trước lẫn sau (hành vi biên đã đúng / đã
 * khoá). Ghi lại được khi viết test.
 *
 * NỘI DUNG:
 *  U1. Fixture 3 clip → newProject → clip 0, undoDepth 1 → undo →
 *      đủ 3 clip + tên + selection khôi phục → redo → clip 0 lại.
 *  U2. Sau U1 (clip đã khôi phục): copy/paste/duplicate/delete đều
 *      hoạt động trên clip đã khôi phục (nợ M12–M15).
 *  U3. newProject trên project đã trống → undoDepth vẫn 0, undo no-op
 *      (không sinh entry rỗng làm nhiễu nút Undo).
 *  U4. newProject 2 lần liên tiếp → undo chỉ khôi phục project ngay
 *      trước đó (project trống lần 1), undo lần 2 no-op.
 *  U5. Sửa thật (thêm chữ) rồi newProject → undo khôi phục cả clip
 *      vừa thêm (entry chuyển đổi chụp spec mới nhất).
 *  U6. replaceProject (mở file) vẫn xoá history — undo sau mở file
 *      không khôi phục project cũ (nợ mở, chưa làm trong đợt này).
 */

import { useStore } from "./store";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

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

function clipCount(): number {
  return useStore
    .getState()
    .spec.tracks.reduce((n, t) => n + t.clips.length, 0);
}

function clipIds(): string[] {
  return useStore
    .getState()
    .spec.tracks.flatMap((t) => t.clips.map((c) => c.id));
}

/** Cài fixture: 2 track, 3 clip (c1/c2 video, x1 chữ) + chọn c1. */
function installFixture(): void {
  const version = useStore.getState().spec.version;
  const spec = {
    version,
    meta: { name: "Fixture undo-after-new", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [
          { kind: "video", id: "c1", src: "clip1.mp4", start: 0, duration: 2 },
          { kind: "video", id: "c2", src: "clip2.mp4", start: 2, duration: 2 },
        ],
      },
      {
        id: "t1",
        kind: "text",
        clips: [
          {
            kind: "text",
            id: "x1",
            text: "Chào",
            start: 0,
            duration: 3,
            style: { fontFamily: "Inter", fontSize: 64, color: "#ffffff" },
          },
        ],
      },
    ],
  };
  useStore.setState({
    spec: spec as never,
    selection: [{ trackId: "v1", clipId: "c1" }],
    playhead: 4,
    playing: false,
  });
}

async function main(): Promise<void> {
  console.log("== U1. newProject → undo khôi phục, redo quay lại trống ==");
  await test("U1a: newProject xong clip về 0, undoDepth = 1", () => {
    installFixture();
    eq(clipCount(), 3, "clip trước newProject");
    useStore.getState().newProject();
    eq(clipCount(), 0, "clip sau newProject");
    eq(useStore.getState().spec.tracks.length, 0, "track sau newProject");
    eq(useStore.getState().undoDepth, 1, "undoDepth sau newProject");
    eq(useStore.getState().undoLabel, "Dự án mới", "undoLabel sau newProject");
  });
  await test("U1b: undo 1 lần khôi phục đủ 3 clip + tên + selection", () => {
    useStore.getState().undo();
    eq(clipCount(), 3, "clip sau undo");
    eq(clipIds().sort(), ["c1", "c2", "x1"], "id clip sau undo");
    eq(useStore.getState().spec.meta.name, "Fixture undo-after-new", "tên project sau undo");
    eq(useStore.getState().selection, [{ trackId: "v1", clipId: "c1" }], "selection sau undo");
    eq(useStore.getState().undoDepth, 0, "undoDepth sau undo");
    eq(useStore.getState().redoDepth, 1, "redoDepth sau undo");
  });
  await test("U1c: redo quay lại project trống", () => {
    useStore.getState().redo();
    eq(clipCount(), 0, "clip sau redo");
    eq(useStore.getState().undoDepth, 1, "undoDepth sau redo");
    eq(useStore.getState().redoDepth, 0, "redoDepth sau redo");
  });

  console.log("== U2. thao tác trên clip đã khôi phục (M12–M15) ==");
  await test("U2a: undo lại để có clip, copy → paste tăng 1 clip", () => {
    useStore.getState().undo(); // về fixture 3 clip, c1 đang chọn
    eq(clipCount(), 3, "clip sau undo lần 2");
    eq(useStore.getState().copySelection(), 1, "copySelection trả 1");
    useStore.getState().pasteClipboard();
    eq(clipCount(), 4, "clip sau paste");
  });
  await test("U2b: duplicate clip đang chọn tăng 1 clip", () => {
    useStore.getState().select({ trackId: "v1", clipId: "c1" });
    useStore.getState().duplicateSelection();
    eq(clipCount(), 5, "clip sau duplicate");
  });
  await test("U2c: delete clip đang chọn giảm 1 clip", () => {
    useStore.getState().deleteSelection();
    eq(clipCount(), 4, "clip sau delete");
  });

  console.log("== U3. newProject trên project trống ==");
  await test("U3: không sinh entry rỗng, undo vẫn no-op", () => {
    useStore.getState().newProject(); // từ 4 clip → trống, entry mới
    eq(clipCount(), 0, "clip sau newProject");
    eq(useStore.getState().undoDepth, 1, "undoDepth sau newProject có clip");
    useStore.getState().undo(); // về 4 clip
    eq(clipCount(), 4, "clip sau undo");
    useStore.getState().newProject(); // về trống
    useStore.getState().undo(); // về 4 clip
    useStore.getState().newProject(); // về trống lần nữa — lúc này spec trước là 4 clip
    eq(useStore.getState().undoDepth, 1, "undoDepth sau newProject từ 4 clip");
    useStore.getState().undo();
    eq(clipCount(), 4, "clip sau undo");
    // Giờ dọn sạch bằng newProject rồi newProject tiếp trên trống:
    useStore.getState().newProject();
    eq(clipCount(), 0, "clip sau newProject dọn");
    useStore.getState().newProject(); // newProject trên project ĐÃ trống
    eq(useStore.getState().undoDepth, 0, "undoDepth sau newProject trên trống");
    eq(useStore.getState().undoLabel, null, "undoLabel sau newProject trên trống");
    useStore.getState().undo(); // no-op
    eq(clipCount(), 0, "clip sau undo no-op");
  });

  console.log("== U4. newProject 2 lần liên tiếp ==");
  await test("U4: undo chỉ về project ngay trước đó, undo lần 2 no-op", () => {
    installFixture();
    useStore.getState().newProject(); // lần 1: fixture → trống
    useStore.getState().newProject(); // lần 2: trống → trống
    eq(clipCount(), 0, "clip sau 2 lần newProject");
    eq(useStore.getState().undoDepth, 0, "undoDepth sau 2 lần newProject trên trống");
    useStore.getState().undo();
    eq(clipCount(), 0, "clip sau undo (không còn gì để về)");
  });

  console.log("== U5. sửa thật rồi newProject ==");
  await test("U5: undo khôi phục cả clip chữ vừa thêm", () => {
    installFixture();
    useStore.getState().addTextClip(); // +1 clip chữ → 4 clip, 1 entry undo
    eq(clipCount(), 4, "clip sau addTextClip");
    useStore.getState().newProject();
    eq(clipCount(), 0, "clip sau newProject");
    useStore.getState().undo();
    eq(clipCount(), 4, "clip sau undo (gồm chữ vừa thêm)");
    eq(useStore.getState().undoDepth, 0, "undoDepth sau undo (history cũ đã xoá)");
  });

  console.log("== U6. replaceProject vẫn xoá history (nợ mở) ==");
  await test("U6: mở file xong undo không khôi phục project cũ", () => {
    installFixture();
    const version = useStore.getState().spec.version;
    const other = {
      version,
      meta: { name: "Project khác", width: 1280, height: 720, fps: 30 },
      tracks: [],
    };
    useStore.getState().replaceProject(other as never);
    eq(clipCount(), 0, "clip sau replaceProject");
    eq(useStore.getState().undoDepth, 0, "undoDepth sau replaceProject");
    useStore.getState().undo();
    eq(clipCount(), 0, "clip sau undo (không khôi phục)");
  });

  console.log(
    `\nstore.undoAfterNew55L5: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
