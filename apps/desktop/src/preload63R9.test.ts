/**
 * preload63R9.test.ts — Phase 9 đợt 63, luồng R9: plumbing ngôn ngữ
 * renderer → preload (đóng nợ đợt 62 R5 §6.2: preload.ts 1 literal).
 *
 * Đo thật (không mock chuỗi): bundle preload.ts với electron stub
 * (esbuild --alias:electron), gọi api thật:
 *   - mặc định (chưa setLanguage) -> lỗi tiếng Việt;
 *   - setLanguage("en") -> readProjectFile/readMediaFile với data IPC
 *     không phải bytes trả lỗi tiếng Anh;
 *   - setLanguage("vi") -> về lại tiếng Việt;
 *   - chuỗi preload KHÓA với fragment i18n round63-r9.json
 *     (key desktop.preloadIpcNotBytes): lệch một chữ là đỏ.
 *
 * Chạy (từ gốc repo; bundle ra scratch ngoài repo, không tạo file
 * trong cây repo):
 *   ./node_modules/.bin/esbuild apps/desktop/src/preload63R9.test.ts \
 *     --bundle --platform=node --format=esm \
 *     --alias:electron=./apps/desktop/test/electron-stub-63r9.ts \
 *     --outfile=/tmp/preload63r9.test.mjs \
 *     && node --test /tmp/preload63r9.test.mjs
 * LƯU Ý: KHÔNG chạy qua scripts/run-node-test.mjs — runner không
 * truyền --alias:electron nên bundle sẽ lấy package electron thật
 * (chỉ export đường dẫn binary, không có contextBridge) và crash lúc
 * import. Alias là yêu cầu của chính test này, ghi rõ ở đây.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { __testState } from "../test/electron-stub-63r9";
import fragment from "../../../apps/web/src/i18n/fragments/round63-r9.json";
import "./preload";

type Lang = "vi" | "en";
type PreloadApi = {
  setLanguage: (lang: Lang) => void;
  readProjectFile: (p: string) => Promise<{ ok: boolean; error?: string }>;
  readMediaFile: (p: string) => Promise<{ ok: boolean; error?: string }>;
};

function api(): PreloadApi {
  assert.ok(__testState.api, "preload phải expose window.vcutDesktop qua contextBridge");
  return __testState.api as PreloadApi;
}

/** Fragment round63-r9.json: key desktop.preloadIpcNotBytes vi/en. */
function fragmentText(lang: Lang): string {
  const f = fragment as unknown as Record<string, Record<string, Record<string, string>>>;
  const v = f[lang]?.desktop?.preloadIpcNotBytes;
  assert.equal(typeof v, "string", `fragment thiếu desktop.preloadIpcNotBytes (${lang})`);
  assert.ok(v.length > 0, `fragment desktop.preloadIpcNotBytes rỗng (${lang})`);
  return v;
}

test("fragment có key desktop.preloadIpcNotBytes vi/en, khác nhau", () => {
  const vi = fragmentText("vi");
  const en = fragmentText("en");
  assert.notEqual(vi, en, "vi/en phải khác nhau");
  assert.equal(vi, "Dữ liệu file qua IPC không phải bytes.");
  assert.equal(en, "File data over IPC is not bytes.");
});

test("preload expose setLanguage (renderer đẩy ngôn ngữ xuống)", () => {
  assert.equal(typeof api().setLanguage, "function", "thiếu api.setLanguage");
});

test("mặc định (chưa setLanguage): lỗi IPC trả tiếng Việt", async () => {
  __testState.invokeImpl = async () => ({ data: "not-bytes", name: "x.json", size: 9 });
  const res = await api().readProjectFile("x.json");
  assert.equal(res.ok, false);
  assert.equal(res.error, fragmentText("vi"));
});

test("setLanguage('en') -> lỗi IPC đổi sang tiếng Anh (cả 2 kênh đọc)", async () => {
  __testState.invokeImpl = async () => ({ data: "not-bytes", name: "x.json", size: 9 });
  api().setLanguage("en");
  const proj = await api().readProjectFile("x.json");
  assert.equal(proj.ok, false);
  assert.equal(proj.error, fragmentText("en"));
  const media = await api().readMediaFile("x.mp4");
  assert.equal(media.ok, false);
  assert.equal(media.error, fragmentText("en"));
});

test("setLanguage('vi') -> lỗi IPC về lại tiếng Việt", async () => {
  __testState.invokeImpl = async () => ({ data: 12345, name: "x.json", size: 5 });
  api().setLanguage("vi");
  const res = await api().readProjectFile("x.json");
  assert.equal(res.ok, false);
  assert.equal(res.error, fragmentText("vi"));
});

test("data bytes thật vẫn đọc được (không bị setLanguage phá)", async () => {
  __testState.invokeImpl = async () => ({
    data: new TextEncoder().encode('{"version":"0.2.0"}').buffer,
    name: "x.json",
    size: 21,
  });
  api().setLanguage("en");
  const res = await api().readProjectFile("x.json");
  assert.equal(res.ok, true);
  assert.equal((res as { text?: string }).text, '{"version":"0.2.0"}');
});
