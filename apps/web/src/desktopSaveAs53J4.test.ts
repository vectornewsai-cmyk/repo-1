/**
 * desktopSaveAs53J4.test.ts — Lưu thành… hỏi tên qua dialog trong app
 * (Phase 9 đợt 53, luồng J4 — thay window.prompt trên desktop).
 *
 * Bối cảnh: renderer Electron chạy sandboxed nên window.prompt() NÉM
 * "prompt() is not supported" (bug D3 đợt 51). Đợt 52 I3 bắt lỗi rồi bỏ
 * qua bước đổi tên; đợt 53 J4 thay bằng dialog nhập tên trong app
 * (components/project/RenameProjectDialog.tsx): saveProjectDesktop(true)
 * gọi askName (mặc định promptProjectName) thay cho window.prompt.
 *
 * Test này chích askName giả để kiểm chứng LUỒNG LƯU (đổi tên / huỷ /
 * trắng / ném lỗi / lưu thẳng), KHÔNG render React — dialog thật được
 * kiểm chứng bằng click-test M3 trên AppImage (xem LIMITS J4). File này
 * THAY THẾ desktopSaveAs52I3.test.ts (test prompt cũ — đã xóa vì
 * desktop.ts không còn gọi window.prompt).
 *
 * CÁCH CHẠY (mẫu test cũ — bundle CJS rồi chạy node):
 *   node_modules/.bin/esbuild apps/web/src/desktopSaveAs53J4.test.ts \
 *     --bundle --platform=node --format=cjs \
 *     --outfile=/tmp/desktopSaveAs53J4.test.cjs --log-level=warning
 *   node /tmp/desktopSaveAs53J4.test.cjs
 * (Dùng require() thay vì import để gán global window giả TRƯỚC khi
 * nạp desktop.ts — module đó đọc window.vcutDesktop lúc chạy.)
 */
declare const require: (id: string) => any;
declare const process: { exit: (code: number) => void };

type AskBehavior = "name" | "cancel" | "blank" | "throw";

const calls: {
  askCount: number;
  askArgs: string[];
  currentPath: string | null;
  dialogArgs: (string | undefined)[];
  written: { content: string; path: string }[];
} = { askCount: 0, askArgs: [], currentPath: null, dialogArgs: [], written: [] };

let askBehavior: AskBehavior = "name";

function fakeAskName(current: string): Promise<string | null> {
  calls.askCount++;
  calls.askArgs.push(current);
  if (askBehavior === "throw") return Promise.reject(new Error("dialog lỗi giả lập"));
  if (askBehavior === "cancel") return Promise.resolve(null);
  if (askBehavior === "blank") return Promise.resolve("   ");
  return Promise.resolve("Tên mới");
}

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
        return "/tmp/h9-test/H9-SaveAs-Unit.vcut";
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

const { saveProjectDesktop, defaultProjectFileName } = require("./desktop");
const { promptProjectName } = require("./components/project/RenameProjectDialog");
const { useStore } = require("./store");
const { readFileSync } = require("node:fs");

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
        ],
      },
    ],
  };
}

function reset() {
  calls.askCount = 0;
  calls.askArgs = [];
  calls.currentPath = null;
  calls.dialogArgs = [];
  calls.written = [];
  useStore.setState({ spec: sampleSpec() });
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
  // T1 — dialog trả tên mới: đổi tên rồi lưu; dialog lưu native nhận
  // tên file mặc định suy ra từ TÊN MỚI (không phải tên cũ).
  reset();
  askBehavior = "name";
  let ok1 = false;
  try {
    ok1 = await saveProjectDesktop(true, fakeAskName);
  } catch (e) {
    check(false, "T1 dialog trả tên: saveProjectDesktop(true) không reject", String(e));
  }
  check(ok1 === true, "T1 dialog trả tên: saveProjectDesktop(true) trả true");
  check(calls.askCount === 1, "T1 dialog trả tên: hỏi tên đúng 1 lần", `askCount=${calls.askCount}`);
  check(calls.askArgs[0] === "Dự án mẫu", "T1 dialog trả tên: hỏi tên với tên hiện tại", `arg=${calls.askArgs[0]}`);
  check(useStore.getState().spec.meta.name === "Tên mới", "T1 dialog trả tên: project được đổi tên", `name=${useStore.getState().spec.meta.name}`);
  check(calls.dialogArgs.length === 1, "T1 dialog trả tên: dialog lưu native mở 1 lần", `dialogArgs=${calls.dialogArgs.length}`);
  check(
    calls.dialogArgs[0] === defaultProjectFileName("Tên mới"),
    "T1 dialog trả tên: dialog lưu nhận tên file mặc định từ tên mới",
    `arg=${calls.dialogArgs[0]} expected=${defaultProjectFileName("Tên mới")}`,
  );
  check(calls.written.length === 1, "T1 dialog trả tên: file được ghi 1 lần", `written=${calls.written.length}`);
  check(
    calls.written[0]?.path === "/tmp/h9-test/H9-SaveAs-Unit.vcut",
    "T1 dialog trả tên: ghi đúng đường dẫn dialog trả về",
    `path=${calls.written[0]?.path}`,
  );
  check(
    (() => {
      try {
        const j = JSON.parse(calls.written[0]?.content ?? "");
        return (
          j?.format === "vcut-project" &&
          j?.spec?.meta?.name === "Tên mới" &&
          Array.isArray(j.spec.tracks) &&
          j.spec.tracks.length === 1
        );
      } catch {
        return false;
      }
    })(),
    "T1 dialog trả tên: nội dung ghi là JSON project hợp lệ (tên mới + tracks)",
  );
  check(calls.currentPath === "/tmp/h9-test/H9-SaveAs-Unit.vcut", "T1 dialog trả tên: current path được đặt", `currentPath=${calls.currentPath}`);

  // T2 — dialog Huỷ (null): huỷ, không mở dialog lưu, không ghi file.
  reset();
  askBehavior = "cancel";
  const ok2 = await saveProjectDesktop(true, fakeAskName);
  check(ok2 === false, "T2 dialog Huỷ: saveProjectDesktop(true) trả false");
  check(calls.dialogArgs.length === 0, "T2 dialog Huỷ: không mở dialog lưu", `dialogArgs=${calls.dialogArgs.length}`);
  check(calls.written.length === 0, "T2 dialog Huỷ: không ghi file", `written=${calls.written.length}`);
  check(calls.currentPath === null, "T2 dialog Huỷ: current path không đổi");
  check(useStore.getState().spec.meta.name === "Dự án mẫu", "T2 dialog Huỷ: tên giữ nguyên");

  // T3 — dialog trả chuỗi trắng: không đổi tên nhưng vẫn lưu.
  reset();
  askBehavior = "blank";
  const ok3 = await saveProjectDesktop(true, fakeAskName);
  check(ok3 === true, "T3 dialog trắng: saveProjectDesktop(true) trả true");
  check(useStore.getState().spec.meta.name === "Dự án mẫu", "T3 dialog trắng: tên giữ nguyên", `name=${useStore.getState().spec.meta.name}`);
  check(calls.written.length === 1, "T3 dialog trắng: file vẫn được ghi");

  // T4 — dialog NÉM lỗi (hiếm): bỏ qua bước đổi tên như fallback D3,
  // Lưu thành… vẫn hoàn thành, không unhandled rejection.
  reset();
  askBehavior = "throw";
  let ok4 = false;
  try {
    ok4 = await saveProjectDesktop(true, fakeAskName);
  } catch (e) {
    check(false, "T4 dialog ném: saveProjectDesktop(true) không reject", String(e));
  }
  check(ok4 === true, "T4 dialog ném: saveProjectDesktop(true) trả true");
  check(calls.dialogArgs.length === 1, "T4 dialog ném: dialog lưu native vẫn mở 1 lần", `dialogArgs=${calls.dialogArgs.length}`);
  check(calls.written.length === 1, "T4 dialog ném: file được ghi 1 lần", `written=${calls.written.length}`);
  check(useStore.getState().spec.meta.name === "Dự án mẫu", "T4 dialog ném: tên giữ nguyên (bỏ qua bước đổi tên)");

  // T5 — Lưu thẳng (as=false) khi đã có current path: KHÔNG hỏi tên,
  // ghi đè đúng path cũ, không mở dialog lưu.
  reset();
  calls.currentPath = "/tmp/h9-test/H9-SaveAs-Cu.vcut";
  askBehavior = "name";
  const ok5 = await saveProjectDesktop(false, fakeAskName);
  check(ok5 === true, "T5 lưu thẳng: saveProjectDesktop(false) trả true");
  check(calls.askCount === 0, "T5 lưu thẳng: không hỏi tên", `askCount=${calls.askCount}`);
  check(calls.dialogArgs.length === 0, "T5 lưu thẳng: không mở dialog lưu");
  check(
    calls.written.length === 1 && calls.written[0]?.path === "/tmp/h9-test/H9-SaveAs-Cu.vcut",
    "T5 lưu thẳng: ghi đè đúng path cũ",
    `written=${JSON.stringify(calls.written.map((w: { path: string }) => w.path))}`,
  );

  // T6 — promptProjectName thật khi không có DOM (node): trả "" ngay
  // (bỏ qua bước đổi tên, khớp fallback D3) — KHÔNG ném, KHÔNG treo.
  {
    const r = await promptProjectName("Dự án mẫu");
    check(r === "", "T6 promptProjectName không DOM: trả \"\" (bỏ qua đổi tên)", `r=${JSON.stringify(r)}`);
  }

  // T7 — i18n parity: key projectMenu vi == en + đủ 5 key rename mới.
  {
    const vi = JSON.parse(readFileSync("apps/web/src/i18n/vi.json", "utf8")).projectMenu;
    const en = JSON.parse(readFileSync("apps/web/src/i18n/en.json", "utf8")).projectMenu;
    const viKeys = Object.keys(vi).sort();
    const enKeys = Object.keys(en).sort();
    check(
      JSON.stringify(viKeys) === JSON.stringify(enKeys),
      "T7 i18n parity: key projectMenu vi == en",
      `onlyVi=${viKeys.filter((k: string) => !enKeys.includes(k))} onlyEn=${enKeys.filter((k: string) => !viKeys.includes(k))}`,
    );
    for (const k of ["renameTitle", "renameLabel", "renameHint", "renameSave", "renameCancel"]) {
      check(typeof vi[k] === "string" && vi[k].length > 0 && typeof en[k] === "string" && en[k].length > 0, `T7 i18n: đủ key mới ${k}`);
    }
  }

  // T8 — desktop.ts không còn gọi window.prompt (hồi quy D3: prompt đã
  // bị loại khỏi flow Lưu thành… trên desktop).
  {
    const src = readFileSync("apps/web/src/desktop.ts", "utf8") as string;
    // Chỉ đếm dòng CODE (bỏ dòng comment // và * — comment giải thích
    // lịch sử D3 được phép nhắc tên window.prompt).
    const callsPrompt = src.split("\n").filter((l: string) => {
      const code = l.trim();
      return code.includes("window.prompt(") && !code.startsWith("//") && !code.startsWith("*");
    });
    check(callsPrompt.length === 0, "T8 hồi quy D3: desktop.ts không còn lời gọi window.prompt(", `dòng còn lại: ${callsPrompt.length}`);
  }

  check(unhandled === 0, "Không có unhandled rejection trong cả lượt test", `unhandled=${unhandled}`);
  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
  process.exit(failures === 0 && unhandled === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("TEST CRASH:", e);
  process.exit(2);
});
