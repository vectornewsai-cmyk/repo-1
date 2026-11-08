// i18nDesktop61R6.test.ts — Phase 9 đợt 61, luồng R6: nối literal
// desktop user-facing vào i18n-desktop.ts + lỗi file-io/native-files
// (xem docs/PHASE9_ROUND61_R6_SERVER_LITERALS_LIMITS.md).
//
// Chạy (không cần Electron — mẫu native-files.test.ts, từ apps/desktop):
//   ../../node_modules/.bin/esbuild --bundle --platform=node --format=esm \
//     --outfile=/tmp/i18n-desktop-61-r6.test.mjs src/i18nDesktop61R6.test.ts \
//     && node --test /tmp/i18n-desktop-61-r6.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  getDesktopLabels,
  tDesktop,
  tDesktopVars,
  type DesktopLabels,
  type DesktopLang,
} from "./i18n-desktop";
import { ffmpegInstallHint } from "./ffmpeg-check";
import { projectDialogFilters, saveExportFile } from "./native-files";
import { readFileBytes, writeProjectFile } from "./file-io";

function flatten(d: Record<string, unknown>, prefix = "", out = new Map<string, string>()): Map<string, string> {
  for (const k of Object.keys(d)) {
    const q = prefix ? `${prefix}.${k}` : k;
    const v = d[k];
    if (typeof v === "object" && v !== null) flatten(v as Record<string, unknown>, q, out);
    else out.set(q, v as string);
  }
  return out;
}
function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

// 36 key desktop mới của R6 (25 đợt đầu + 11 models/about bổ sung).
const NEW_36 = [
  "about.docsLine",
  "about.logHint",
  "about.repoLine",
  "about.settingsLine",
  "about.versionLine",
  "common.close",
  "crash.reasonLine",
  "dialogs.addMedia",
  "dialogs.allFiles",
  "dialogs.exportVideo",
  "dialogs.mediaFilter",
  "dialogs.openProject",
  "dialogs.projectFilter",
  "dialogs.projectFilterLong",
  "dialogs.saveProject",
  "ffmpeg.installHint",
  "ffmpeg.notFoundTitle",
  "ffmpeg.stillUsable",
  "fileIo.cannotOpen",
  "fileIo.cannotRead",
  "fileIo.cannotWrite",
  "fileIo.onlyProject",
  "fileIo.tooLarge",
  "menu.openGithub",
  "models.allReady",
  "models.alreadyDownloading",
  "models.checkFailed",
  "models.emptyId",
  "models.missing",
  "models.noDownload",
  "models.noRoot",
  "nativeFiles.destMustBeMp4",
  "nativeFiles.downloadFailed",
  "nativeFiles.invalidParams",
  "nativeFiles.missingDest",
  "nativeFiles.missingJobId",
];

test("labels: 95 lá vi/en khớp nhau, 36 key mới đủ + khác vi/en + placeholder khớp", () => {
  const vi = flatten(getDesktopLabels("vi") as unknown as Record<string, unknown>);
  const en = flatten(getDesktopLabels("en") as unknown as Record<string, unknown>);
  assert.equal(vi.size, 95, `labels vi phải có 95 lá, nhận ${vi.size}`);
  assert.equal(en.size, 95, `labels en phải có 95 lá, nhận ${en.size}`);
  for (const k of vi.keys()) assert.ok(en.has(k), `en thiếu key ${k}`);
  for (const k of en.keys()) assert.ok(vi.has(k), `vi thiếu key ${k}`);
  for (const k of vi.keys()) {
    assert.ok(vi.get(k)!.length > 0, `${k}: vi rỗng`);
    assert.ok(en.get(k)!.length > 0, `${k}: en rỗng`);
    assert.deepEqual(placeholders(vi.get(k)!), placeholders(en.get(k)!), `${k}: placeholder vi/en lệch`);
  }
  for (const k of NEW_36) {
    assert.ok(vi.has(k), `vi thiếu key mới ${k}`);
    assert.ok(en.has(k), `en thiếu key mới ${k}`);
    assert.notEqual(vi.get(k), en.get(k), `${k}: vi phải khác en`);
  }
});

test("tDesktopVars: thay biến {…}, biến lạ giữ nguyên, thiếu key fallback vi", () => {
  assert.equal(
    tDesktopVars("en", "models.allReady", { ready: "3", total: "5", root: "/m" }),
    "3/5 AI models ready (/m)",
  );
  assert.equal(
    tDesktopVars("vi", "models.missing", { missing: "a, b", root: "/m" }),
    "Thiếu model: a, b — tải trong app (mục Model AI), thư mục: /m",
  );
  assert.equal(
    tDesktopVars("en", "models.allReady", { ready: "1" }),
    "1/{total} AI models ready ({root})",
  );
  // Key không có → tDesktop trả key (mẫu cũ), không throw.
  assert.equal(tDesktop("en", "no.such.key"), "no.such.key");
});

test("projectDialogFilters + ffmpegInstallHint: vi/en đúng ngôn ngữ", () => {
  const vi = projectDialogFilters("vi");
  const en = projectDialogFilters("en");
  assert.deepEqual(
    vi.map((f) => f.name),
    ["Dự án VCut (.vcut, .vcut.json)", "Tất cả file"],
  );
  assert.deepEqual(
    en.map((f) => f.name),
    ["VCut Project (.vcut, .vcut.json)", "All files"],
  );
  assert.ok(ffmpegInstallHint("vi").includes("cần ffmpeg hệ thống"));
  assert.ok(ffmpegInstallHint("en").includes("needs system ffmpeg"));
  assert.notEqual(ffmpegInstallHint("vi"), ffmpegInstallHint("en"));
  // Mặc định vi (caller cũ không truyền lang giữ hành vi cũ).
  assert.equal(ffmpegInstallHint(), ffmpegInstallHint("vi"));
});

test("dialogs labels: vi/en đúng từng chữ", () => {
  const vi = getDesktopLabels("vi");
  const en = getDesktopLabels("en");
  assert.equal(vi.dialogs.projectFilter, "Dự án VCut");
  assert.equal(en.dialogs.projectFilter, "VCut Project");
  assert.equal(vi.dialogs.mediaFilter, "Media (video, audio, ảnh)");
  assert.equal(en.dialogs.mediaFilter, "Media (video, audio, images)");
  assert.equal(vi.dialogs.openProject, "Mở dự án");
  assert.equal(en.dialogs.openProject, "Open project");
  assert.equal(vi.menu.openGithub, "VCut Studio trên GitHub");
  assert.equal(en.menu.openGithub, "VCut Studio on GitHub");
  assert.equal(vi.common.close, "Đóng");
  assert.equal(en.common.close, "Close");
  assert.equal(vi.ffmpeg.notFoundTitle, "Không tìm thấy ffmpeg hệ thống");
  assert.equal(en.ffmpeg.notFoundTitle, "System ffmpeg not found");
  assert.equal(vi.crash.reasonLine, "Lý do: {reason}{exitPart}");
  assert.equal(en.crash.reasonLine, "Reason: {reason}{exitPart}");
});

function enLookup(key: string, vars?: Record<string, string>): string {
  return tDesktopVars("en", key, vars ?? {});
}

test("saveExportFile EN: 4 lỗi dịch thật qua lookup", async () => {
  await assert.rejects(
    saveExportFile("", "/tmp/x.mp4", "http://127.0.0.1:9", fetch, enLookup),
    (e: unknown) => (e as Error).message === "Missing render jobId.",
  );
  await assert.rejects(
    saveExportFile("j1", "", "http://127.0.0.1:9", fetch, enLookup),
    (e: unknown) => (e as Error).message === "Missing destination path.",
  );
  await assert.rejects(
    saveExportFile("j1", "/tmp/x.txt", "http://127.0.0.1:9", fetch, enLookup),
    (e: unknown) => (e as Error).message === "Destination must be an .mp4 file: /tmp/x.txt",
  );
  const fetch500 = (async () => ({ ok: false, status: 500, body: null })) as unknown as typeof fetch;
  await assert.rejects(
    saveExportFile("j1", "/tmp/x.mp4", "http://127.0.0.1:9", fetch500, enLookup),
    (e: unknown) => (e as Error).message === "Could not download the rendered video (bridge returned 500).",
  );
});

test("saveExportFile VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", async () => {
  await assert.rejects(
    saveExportFile("", "/tmp/x.mp4", "http://127.0.0.1:9"),
    (e: unknown) => (e as Error).message === "Thiếu jobId render.",
  );
  await assert.rejects(
    saveExportFile("j1", "", "http://127.0.0.1:9"),
    (e: unknown) => (e as Error).message === "Thiếu đường dẫn đích.",
  );
  await assert.rejects(
    saveExportFile("j1", "/tmp/x.txt", "http://127.0.0.1:9"),
    (e: unknown) => (e as Error).message === "Đường dẫn đích phải là file .mp4: /tmp/x.txt",
  );
});

test("file-io EN: lỗi đọc/ghi dịch thật qua lookup", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r6-"));
  const txt = path.join(dir, "a.txt");
  fs.writeFileSync(txt, "x");
  await assert.rejects(
    readFileBytes(txt, enLookup),
    (e: unknown) => (e as Error).message === "Cannot open this file in VCut: a.txt",
  );
  await assert.rejects(
    readFileBytes(path.join(dir, "nope.vcut"), enLookup),
    (e: unknown) => (e as Error).message.startsWith("Cannot read file: "),
  );
  await assert.rejects(
    writeProjectFile(txt, "{}", enLookup),
    (e: unknown) => (e as Error).message === "Only project files can be written (.vcut/.vcut.json): a.txt",
  );
  // Ghi vào đường dẫn mà thư mục cha là file → mkdir lỗi → cannotWrite.
  await assert.rejects(
    writeProjectFile(path.join(txt, "x.vcut"), "{}", enLookup),
    (e: unknown) => (e as Error).message.startsWith("Cannot write file: "),
  );
  fs.rmSync(dir, { recursive: true, force: true });
});

test("file-io VI fallback: không lookup → đúng từng chữ chuỗi VI cũ", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r6-"));
  const txt = path.join(dir, "a.txt");
  fs.writeFileSync(txt, "x");
  await assert.rejects(
    readFileBytes(txt),
    (e: unknown) => (e as Error).message === "Không mở được file này trong VCut: a.txt",
  );
  await assert.rejects(
    readFileBytes(path.join(dir, "nope.vcut")),
    (e: unknown) => (e as Error).message.startsWith("Không đọc được file: "),
  );
  await assert.rejects(
    writeProjectFile(txt, "{}"),
    (e: unknown) => (e as Error).message === "Chỉ ghi được file dự án (.vcut/.vcut.json): a.txt",
  );
  await assert.rejects(
    writeProjectFile(path.join(txt, "x.vcut"), "{}"),
    (e: unknown) => (e as Error).message.startsWith("Không ghi được file: "),
  );
  fs.rmSync(dir, { recursive: true, force: true });
});

test("labels dùng ở call site: main/menu/about không còn literal VI thô ngoài miễn trừ", () => {
  // Khóa bằng scanner của test kiểm kê web (i18nServerLiterals61R6):
  // about.ts 0, crash.ts 0, menu.ts chỉ còn ternary song ngữ + tên ngôn ngữ.
  const about = getDesktopLabels("vi").about;
  assert.equal(about.logHint, "Để báo lỗi, gửi kèm file log:");
  assert.equal(getDesktopLabels("en").about.logHint, "To report a bug, attach the log file:");
  const labels: DesktopLabels = getDesktopLabels("en");
  assert.equal(labels.models.noRoot, "Model folder not resolved yet (app still starting).");
  assert.equal(labels.nativeFiles.invalidParams, "desktop:save-export-file: invalid parameters.");
});
