/**
 * desktopMenuActions53J2.test.ts — Menu Chỉnh sửa/Tệp/Xem qua
 * handleMenuAction (Phase 9 đợt 53, luồng J2 — điều tra M10–M26 đợt 52).
 *
 * Bối cảnh: full run đợt 52 (8/27 menu) cho thấy action M10–M26 "không
 * tới renderer" sau M9. Trước khi kết luận IPC gãy, test này cô lập
 * TẦNG HANDLER trong renderer: gọi handleMenuAction trực tiếp với store
 * thật (không qua menu native, không qua IPC) để chứng minh từng action
 * (undo/redo/cut/copy/paste/duplicate/delete/select-all/new-project/
 * export-video/save) làm đúng việc nó phải làm trên project mẫu 3 clip.
 * IPC menu→renderer được kiểm chứng riêng bằng click-test trên AppImage
 * (xem docs/PHASE9_ROUND53_J2_MENU_ACTIONS_LIMITS.md).
 *
 * CÁCH CHẠY (mẫu test desktopSaveAs53J4 — bundle CJS rồi chạy node):
 *   node_modules/.bin/esbuild apps/web/src/desktopMenuActions53J2.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/desktopMenuActions53J2.test.cjs --log-level=warning
 *   node /tmp/desktopMenuActions53J2.test.cjs
 * (Dùng require() thay vì import để gán global window giả TRƯỚC khi
 * nạp desktop.ts — module đó đọc window.vcutDesktop lúc chạy.)
 */
declare const require: (id: string) => any;
declare const process: { exit: (code: number) => void };

const calls: {
  currentPath: string | null;
  dialogArgs: (string | undefined)[];
  exportOpens: number;
  written: { content: string; path: string }[];
} = { currentPath: null, dialogArgs: [], exportOpens: 0, written: [] };

function makeWindow() {
  return {
    localStorage: {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => undefined,
    },
    vcutDesktop: {
      getCurrentProjectPath: async () => calls.currentPath,
      noteProjectOpened: async () => ({ ok: true }),
      notifyLanguageChanged: async () => undefined,
      onLanguageChanged: () => () => undefined,
      onMenuAction: () => () => undefined,
      onOpenFile: () => () => undefined,
      readMediaFile: async () => ({ error: "n/a", ok: false }),
      readProjectFile: async () => ({ error: "n/a", ok: false }),
      saveProjectDialog: async (def?: string) => {
        calls.dialogArgs.push(def);
        return "/tmp/h9-j2-test/H9-MenuActions-Unit.vcut";
      },
      setCurrentProjectPath: async (p: string | null) => {
        calls.currentPath = p;
      },
      writeProjectFile: async (p: string, content: string) => {
        calls.written.push({ content, path: p });
        return { ok: true };
      },
    },
  };
}

(globalThis as any).window = makeWindow();
// Một số module đọc bare `localStorage` (không qua window).
(globalThis as any).localStorage = (globalThis as any).window.localStorage;

const { handleMenuAction } = require("./desktop");
const { useStore } = require("./store");
const { markSaved } = require("./lib/projectRepo");

function sampleSpec() {
  return {
    version: "0.2.0",
    meta: { fps: 30, height: 720, name: "Dự án mẫu", width: 1280 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        label: "Video 1",
        clips: [
          { duration: 4, id: "c-1", in: 0, kind: "video", out: 4, src: "mau-1.webm", start: 0 },
          { duration: 4, id: "c-2", in: 0, kind: "video", out: 4, src: "mau-2.webm", start: 4 },
        ],
      },
      {
        id: "t1",
        kind: "text",
        label: "Chữ 1",
        clips: [
          {
            duration: 5, id: "c-3", kind: "text", start: 0.5,
            style: { animation: "fadeUp", bold: true, color: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", fontSize: 72, x: 0.5, y: 0.32 },
            text: "Xin chào! Đây là VCut Studio",
          },
        ],
      },
    ],
  };
}

function clipCount(): number {
  return useStore.getState().spec.tracks.reduce((n: number, t: any) => n + t.clips.length, 0);
}
function selectionCount(): number {
  return useStore.getState().selection.length;
}
function callbacks() {
  return { openExport: () => { calls.exportOpens++; } };
}

function reset() {
  calls.currentPath = null;
  calls.dialogArgs = [];
  calls.exportOpens = 0;
  calls.written = [];
  // Đợt 55 L5: newProject() từ project có clip nay để lại 1 entry
  // chuyển đổi "Dự án mới" (để undo khôi phục project cũ) nên 1 lần
  // gọi không còn dọn sạch history như trước. Gọi 2 lần: lần 1 về
  // project trống (+ entry), lần 2 trên project đã trống thì clear
  // thường (không sinh entry rỗng) → history thật sự rỗng rồi mới
  // đặt sample. Không đổi ngữ nghĩa reset(): vẫn là "sạch hoàn toàn".
  useStore.getState().newProject();
  useStore.getState().newProject();
  useStore.setState({ spec: sampleSpec(), selection: [] });
  markSaved(useStore.getState().spec);
}

let failures = 0;
let unhandled = 0;
process.on("unhandledRejection", (e) => {
  unhandled++;
  console.error("UNHANDLED REJECTION:", e);
});
function check(cond: unknown, label: string, extra = "") {
  if (cond) console.log(`PASS  ${label}`);
  else {
    failures++;
    console.log(`FAIL  ${label}${extra ? " — " + extra : ""}`);
  }
}

async function main() {
  // U1 — select-all: chọn hết 3 clip mẫu.
  reset();
  check((await handleMenuAction("select-all", callbacks())) === true, "U1 select-all: trả true");
  check(selectionCount() === 3, "U1 select-all: chọn đúng 3 clip", `selection=${selectionCount()}`);

  // U2 — copy + paste: nhân đôi clip 3 → 6 (kỳ vọng M13 đợt 52).
  reset();
  await handleMenuAction("select-all", callbacks());
  check((await handleMenuAction("copy", callbacks())) === true, "U2 copy: trả true");
  check(useStore.getState().clipboardSize === 3, "U2 copy: clipboard có 3 clip", `clipboardSize=${useStore.getState().clipboardSize}`);
  check((await handleMenuAction("paste", callbacks())) === true, "U2 paste: trả true");
  check(clipCount() === 6, "U2 paste: clip 3 → 6", `clips=${clipCount()}`);

  // U3 — undo sau paste: về lại 3.
  check((await handleMenuAction("undo", callbacks())) === true, "U3 undo sau paste: trả true");
  check(clipCount() === 3, "U3 undo sau paste: clip về 3", `clips=${clipCount()}`);

  // U4 — duplicate: chọn hết + nhân bản 3 → 6; undo về 3.
  reset();
  await handleMenuAction("select-all", callbacks());
  check((await handleMenuAction("duplicate", callbacks())) === true, "U4 duplicate: trả true");
  check(clipCount() === 6, "U4 duplicate: clip 3 → 6", `clips=${clipCount()}`);
  await handleMenuAction("undo", callbacks());
  check(clipCount() === 3, "U4 undo sau duplicate: clip về 3", `clips=${clipCount()}`);

  // U5 — cut: chọn hết + cắt 3 → 0; undo về 3 (kỳ vọng M14).
  reset();
  await handleMenuAction("select-all", callbacks());
  check((await handleMenuAction("cut", callbacks())) === true, "U5 cut: trả true");
  check(clipCount() === 0, "U5 cut: clip 3 → 0", `clips=${clipCount()}`);
  check((await handleMenuAction("undo", callbacks())) === true, "U5 undo sau cut: trả true");
  check(clipCount() === 3, "U5 undo sau cut: clip về 3", `clips=${clipCount()}`);

  // U6 — delete + undo + redo (kỳ vọng M12/M11).
  reset();
  await handleMenuAction("select-all", callbacks());
  check((await handleMenuAction("delete", callbacks())) === true, "U6 delete: trả true");
  check(clipCount() === 0, "U6 delete: clip 3 → 0", `clips=${clipCount()}`);
  await handleMenuAction("undo", callbacks());
  check(clipCount() === 3, "U6 undo sau delete: clip về 3", `clips=${clipCount()}`);
  check((await handleMenuAction("redo", callbacks())) === true, "U6 redo: trả true");
  check(clipCount() === 0, "U6 redo: clip về 0", `clips=${clipCount()}`);

  // U7 — undo/redo khi history rỗng: trả true, không crash, không đổi clip.
  // Đợt 55 L5: newProject() 1 lần từ sample 3 clip nay để lại entry
  // chuyển đổi nên history KHÔNG rỗng; gọi 2 lần (lần 2 trên project
  // đã trống → clear thường, không sinh entry) mới có history thật rỗng.
  reset();
  useStore.getState().newProject(); // 3 clip → trống (+ entry chuyển đổi)
  useStore.getState().newProject(); // trống → trống (xoá entry, history rỗng)
  check((await handleMenuAction("undo", callbacks())) === true, "U7 undo history rỗng: trả true, không crash");
  check(clipCount() === 0, "U7 undo history rỗng: clip vẫn 0", `clips=${clipCount()}`);
  check((await handleMenuAction("redo", callbacks())) === true, "U7 redo history rỗng: trả true, không crash");

  // U8 — new-project (M9): project sạch → reset về 0 clip, trả true.
  reset();
  check((await handleMenuAction("new-project", callbacks())) === true, "U8 new-project: trả true");
  check(clipCount() === 0, "U8 new-project: clip về 0", `clips=${clipCount()}`);
  check(selectionCount() === 0, "U8 new-project: selection rỗng", `selection=${selectionCount()}`);

  // U9 — export-video: mở panel export qua callback, trả true.
  reset();
  check((await handleMenuAction("export-video", callbacks())) === true, "U9 export-video: trả true");
  check(calls.exportOpens === 1, "U9 export-video: openExport gọi đúng 1 lần", `exportOpens=${calls.exportOpens}`);

  // U10 — action lạ: trả false (caller log cảnh báo).
  reset();
  check((await handleMenuAction("khong-co-action-nay" as never, callbacks())) === false, "U10 action lạ: trả false");

  // U11 — save-project khi chưa có current path: mở dialog lưu + ghi file.
  reset();
  check((await handleMenuAction("save-project", callbacks())) === true, "U11 save-project: trả true");
  check(calls.dialogArgs.length === 1, "U11 save-project: dialog lưu mở 1 lần", `dialogArgs=${calls.dialogArgs.length}`);
  check(calls.written.length === 1, "U11 save-project: file ghi 1 lần", `written=${calls.written.length}`);
  check(calls.currentPath === "/tmp/h9-j2-test/H9-MenuActions-Unit.vcut", "U11 save-project: current path được đặt", `currentPath=${calls.currentPath}`);

  // U12 — save-project-as: không DOM → promptProjectName trả "" (J4 T6)
  // nên bỏ qua đổi tên nhưng vẫn mở dialog + ghi file.
  reset();
  check((await handleMenuAction("save-project-as", callbacks())) === true, "U12 save-project-as: trả true");
  check(calls.dialogArgs.length === 1, "U12 save-project-as: dialog lưu mở 1 lần", `dialogArgs=${calls.dialogArgs.length}`);
  check(calls.written.length === 1, "U12 save-project-as: file ghi 1 lần", `written=${calls.written.length}`);

  // U13 — M10 đợt 52, ĐỔI HÀNH VI CÓ CHỦ ĐÍCH đợt 55 L5 (nợ M10 đợt 54
  // K4 §3): undo sau new-project nay KHÔI PHỤC project cũ (1 entry
  // chuyển đổi "Dự án mới" trong store.newProject, xem
  // docs/PHASE9_ROUND55_L5_UNDO_AFTER_NEW_LIMITS.md). Hành vi cũ
  // "KHÔNG khôi phục (clearHistory)" đã bị bãi — case này khóa hành vi
  // mới: undo → 3 clip, redo → 0 clip.
  reset();
  await handleMenuAction("select-all", callbacks());
  await handleMenuAction("delete", callbacks());
  check(clipCount() === 0, "U13 setup: delete xong clip về 0", `clips=${clipCount()}`);
  await handleMenuAction("undo", callbacks());
  check(clipCount() === 3, "U13 setup: undo khôi phục 3 clip", `clips=${clipCount()}`);
  check((await handleMenuAction("new-project", callbacks())) === true, "U13 new-project: trả true");
  check(clipCount() === 0, "U13 new-project: clip về 0", `clips=${clipCount()}`);
  check((await handleMenuAction("undo", callbacks())) === true, "U13 undo sau new-project: trả true, không crash");
  check(clipCount() === 3, "U13 undo sau new-project: KHÔI PHỤC project cũ (đợt 55 L5)", `clips=${clipCount()}`);
  check((await handleMenuAction("redo", callbacks())) === true, "U13 redo sau undo: trả true, không crash");
  check(clipCount() === 0, "U13 redo sau undo: quay lại project trống", `clips=${clipCount()}`);

  // U14 — history hoạt động lại bình thường sau new-project (không hỏng
  // vĩnh viễn): đặt lại sample (không qua newProject) rồi delete + undo.
  useStore.setState({ spec: sampleSpec(), selection: [] });
  markSaved(useStore.getState().spec);
  await handleMenuAction("select-all", callbacks());
  await handleMenuAction("delete", callbacks());
  check(clipCount() === 0, "U14 setup: delete xong clip về 0", `clips=${clipCount()}`);
  check((await handleMenuAction("undo", callbacks())) === true, "U14 undo sau edit mới: trả true");
  check(clipCount() === 3, "U14 undo sau edit mới: khôi phục 3 clip", `clips=${clipCount()}`);

  check(unhandled === 0, "Không có unhandled rejection trong cả lượt test", `unhandled=${unhandled}`);
  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
  process.exit(failures === 0 && unhandled === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("TEST CRASH:", e);
  process.exit(2);
});
