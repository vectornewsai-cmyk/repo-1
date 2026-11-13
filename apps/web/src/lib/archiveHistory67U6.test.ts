/**
 * archiveHistory67U6.test.ts — Test khóa đợt 67 luồng U6: `history.json`
 * kèm trong archive `.vcut.zip` (đóng nợ đợt 66 T7 §5.2: lịch sử của
 * file gốc không đi theo archive).
 *
 * CHẠY BẰNG esbuild bundle (không chạy trực tiếp bằng Node): archive.ts
 * import "./projectRepo" không đuôi nên Node type-stripping không resolve
 * được (đã chứng minh ở archiveNested32P4.test.ts). Bundle bằng code
 * thật, không mock:
 *   cd ~/workspace/repo-1 && ./node_modules/.bin/esbuild \
 *     apps/web/src/lib/archiveHistory67U6.test.ts --bundle --platform=node \
 *     --format=esm --outfile=/tmp/vcut-u6-archive-test.mjs && node /tmp/vcut-u6-archive-test.mjs
 * (outfile ở /tmp, ngoài repo, không stage.)
 *
 * Phạm vi test (toàn bộ qua code sản phẩm thật, JSZip thật):
 * - exportArchive kèm history → zip chứa history.json đúng nội dung;
 *   importArchive trả lại history (projectId + số version khớp).
 * - exportArchive không kèm history / history rỗng → zip không có
 *   history.json; importArchive trả history undefined (archive cũ).
 * - importArchive với history.json hỏng (JSON lỗi / không phải object)
 *   → historyError có nội dung, import vẫn ok, spec vẫn đủ.
 * - history.json là entry cho phép (isAllowedEntry); entry lạ khác vẫn
 *   bị từ chối như cũ.
 *
 * Không kiểm chứng hash từng version ở tầng này (đó là việc của
 * HistoryStore.importArchiveHistory — test ở legacyAdopt67U6.test.ts
 * P4/P5); tầng archive chỉ vận chuyển JSON nguyên vẹn.
 */
import JSZip from "jszip";
import {
  ARCHIVE_HISTORY_FILE,
  exportArchive,
  importArchive,
  isAllowedEntry,
  type HistoryExport,
} from "./archive.ts";
import type { VideoSpec } from "@repo-1/video-spec";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: { exitCode: number | undefined };

let pass = 0;
let fail = 0;
const failedNames: string[] = [];

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
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

function assert(cond: unknown, what = ""): void {
  if (!cond) throw new Error(what || "assert thất bại");
}

const UUID_Q = "99999999-8888-7777-6666-555555555555";

function spec(name: string, nClips: number): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name, width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: Array.from({ length: nClips }, (_, i) => ({
        id: `c${i + 1}`, kind: "video", src: "a.mp4", start: i * 2, duration: 2, in: 0, out: 2,
      })),
    }],
  } as unknown as VideoSpec;
}

/**
 * HistoryExport giả nhưng đúng định dạng (hash không kiểm ở tầng
 * archive — xem đầu file). Hai version có id/projectId/hash khác nhau
 * để importArchiveHistory ở tầng trên phân biệt được.
 */
function fakeHistory(): HistoryExport {
  const s1 = spec("Q", 1);
  const s2 = spec("Q", 2);
  return {
    format: "vcut-history",
    formatVersion: 1,
    projectId: UUID_Q,
    exportedAt: new Date().toISOString(),
    versions: [
      {
        id: `${UUID_Q}@1000-aaaaaaaa`, projectId: UUID_Q, createdAt: 1000,
        createdAtIso: new Date(1000).toISOString(), label: "", hash: "aaaaaaaa",
        parentId: "", summary: [], spec: s1,
      },
      {
        id: `${UUID_Q}@2000-bbbbbbbb`, projectId: UUID_Q, createdAt: 2000,
        createdAtIso: new Date(2000).toISOString(), label: "", hash: "bbbbbbbb",
        parentId: `${UUID_Q}@1000-aaaaaaaa`, summary: [], spec: s2,
      },
    ],
  };
}

async function zipNames(blob: Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(blob);
  return Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
}

async function main(): Promise<void> {
  console.log("archiveHistory67U6:");

  await test("A1: exportArchive kèm history → zip có history.json; importArchive trả lại nguyên vẹn", async () => {
    const history = fakeHistory();
    const res = await exportArchive(spec("Q", 2), "Q", [], UUID_Q, history);
    assert(res.ok && res.blob, "export phải ok");
    const names = await zipNames(res.blob);
    assert(names.includes(ARCHIVE_HISTORY_FILE), `zip phải có history.json, nhận ${names.join(",")}`);
    const back = await importArchive(res.blob);
    assert(back.ok && back.spec, "import lại phải ok");
    eq(back.projectId, UUID_Q);
    assert(back.history, "import phải trả history");
    eq(back.history?.format, "vcut-history");
    eq(back.history?.formatVersion, 1);
    eq(back.history?.projectId, UUID_Q);
    eq(back.history?.versions.length, 2, "đủ 2 version");
    eq(back.history?.versions.map((v) => v.id), history.versions.map((v) => v.id), "id version giữ nguyên");
    eq(back.history?.versions[1].parentId, history.versions[1].parentId, "parentId giữ nguyên");
    eq(back.historyError, undefined, "không có lỗi history");
  });

  await test("A2: exportArchive không kèm history → zip không có history.json; import trả history undefined", async () => {
    const res = await exportArchive(spec("Q", 2), "Q", [], UUID_Q);
    assert(res.ok && res.blob, "export phải ok");
    const names = await zipNames(res.blob);
    assert(!names.includes(ARCHIVE_HISTORY_FILE), "không kèm history thì zip không có history.json");
    const back = await importArchive(res.blob);
    assert(back.ok && back.spec, "import lại phải ok");
    eq(back.history, null, "archive cũ không có history (null, không phải undefined)");
    eq(back.historyError, undefined);
  });

  await test("A3: exportArchive với history rỗng version → không ghi history.json", async () => {
    const empty: HistoryExport = { ...fakeHistory(), versions: [] };
    const res = await exportArchive(spec("Q", 2), "Q", [], UUID_Q, empty);
    assert(res.ok && res.blob, "export phải ok");
    const names = await zipNames(res.blob);
    assert(!names.includes(ARCHIVE_HISTORY_FILE), "history rỗng thì không ghi file");
  });

  await test("A4: history.json hỏng (JSON lỗi) → historyError có nội dung, import vẫn ok", async () => {
    const base = await exportArchive(spec("Q", 2), "Q", [], UUID_Q);
    assert(base.ok && base.blob, "export gốc phải ok");
    const zip = await JSZip.loadAsync(base.blob);
    zip.file(ARCHIVE_HISTORY_FILE, "{json-hong");
    const blob = await zip.generateAsync({ type: "blob" });
    const back = await importArchive(blob);
    assert(back.ok && back.spec, "history hỏng không được hỏng cả lần nhập archive");
    eq(back.history, null, "history hỏng thì history null");
    assert(typeof back.historyError === "string" && back.historyError.length > 0, "phải có historyError");
    assert(back.historyError.includes("history.json"), `historyError phải nhắc tới history.json, nhận: ${back.historyError}`);
  });

  await test("A5: history.json không phải object → historyError, import vẫn ok", async () => {
    const base = await exportArchive(spec("Q", 2), "Q", [], UUID_Q);
    assert(base.ok && base.blob, "export gốc phải ok");
    const zip = await JSZip.loadAsync(base.blob);
    zip.file(ARCHIVE_HISTORY_FILE, "[1, 2, 3]");
    const blob = await zip.generateAsync({ type: "blob" });
    const back = await importArchive(blob);
    assert(back.ok && back.spec, "history sai dạng không được hỏng cả lần nhập archive");
    eq(back.history, null, "history không phải object thì history null");
    assert(typeof back.historyError === "string" && back.historyError.length > 0);
  });

  await test("A6: history.json là entry cho phép; entry lạ khác vẫn bị từ chối như cũ", async () => {
    assert(isAllowedEntry(ARCHIVE_HISTORY_FILE), "history.json phải là entry cho phép");
    assert(!isAllowedEntry("evil.txt"), "entry lạ vẫn không cho phép");
    const base = await exportArchive(spec("Q", 2), "Q", [], UUID_Q);
    assert(base.ok && base.blob, "export gốc phải ok");
    const zip = await JSZip.loadAsync(base.blob);
    zip.file("evil.txt", "x");
    const blob = await zip.generateAsync({ type: "blob" });
    const back = await importArchive(blob);
    eq(back.ok, false, "archive có entry lạ phải bị từ chối");
    assert(back.errors.length > 0);
  });

  console.log(
    `\narchiveHistory67U6: ${pass} pass, ${fail} fail${fail > 0 ? ` (${failedNames.join(", ")})` : ""}`,
  );
  process.exitCode = fail > 0 ? 1 : 0;
}

void main();
