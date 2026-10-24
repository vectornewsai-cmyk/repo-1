/**
 * sharePage.test.ts — Test thật cho trang chia sẻ HTML (Phase 8 Q7).
 *
 * Chạy trực tiếp (Node ≥ 22.18, type-stripping):
 *   node apps/web/src/lib/sharePage.test.ts
 */
import { buildSharePage, escapeHtml } from "./sharePage.ts";
import type { VideoSpec } from "@repo-1/video-spec";

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

function eq(a: unknown, b: unknown, what = ""): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${what} nhận ${sa}, muốn ${sb}`);
}

function spec(): VideoSpec {
  return {
    version: "0.2.0",
    meta: { name: "Demo", width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: [{ id: "c1", kind: "video", src: "a.mp4", start: 0, duration: 5, in: 0, out: 5 }],
    }],
  } as unknown as VideoSpec;
}

test("escapeHtml: chặn chèn script qua tiêu đề", () => {
  eq(escapeHtml(`<script>alert(1)</script>"'&`), "&lt;script&gt;alert(1)&lt;/script&gt;&quot;&#39;&amp;");
});

test("embedded: HTML chứa video data URI + tiêu đề đã escape + spec parse được", () => {
  const evil = `Demo <script>alert(1)</script>`;
  const { html, mode } = buildSharePage({
    title: evil, spec: spec(), videoMime: "video/mp4",
    videoBase64: Buffer.from("FAKEVIDEO").toString("base64"),
  });
  eq(mode, "embedded");
  if (!html.includes("<video")) throw new Error("thiếu thẻ video");
  if (!html.includes("data:video/mp4;base64,")) throw new Error("thiếu data URI");
  if (html.includes("<script>alert(1)</script>")) throw new Error("tiêu đề chưa escape — chèn script được");
  if (!html.includes("&lt;script&gt;")) throw new Error("tiêu đề escape sai");
  const m = html.match(/<script type="application\/json" id="vcut-spec">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("thiếu khối spec JSON");
  const parsed = JSON.parse(m[1]) as { meta: { name: string } };
  eq(parsed.meta.name, "Demo");
});

test("embedded: spec chứa chuỗi </script> không phá được khối JSON", () => {
  const s = spec();
  (s.tracks[0].clips[0] as unknown as Record<string, unknown>).src = "</script><script>alert(1)</script>";
  const { html } = buildSharePage({ title: "X", spec: s, videoMime: "video/mp4", videoBase64: "AAAA" });
  const m = html.match(/<script type="application\/json" id="vcut-spec">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("khối JSON bị phá");
  const parsed = JSON.parse(m[1]) as { tracks: Array<{ clips: Array<{ src: string }> }> };
  eq(parsed.tracks[0].clips[0].src, "</script><script>alert(1)</script>");
});

test("linked: dùng tên file tương đối, có cảnh báo gửi kèm", () => {
  const { html, mode, warnings } = buildSharePage({
    title: "Demo", spec: spec(), videoMime: "video/mp4", videoFileName: "video.mp4",
  });
  eq(mode, "linked");
  if (!html.includes('src="video.mp4"')) throw new Error("thiếu src tương đối");
  if (!warnings.some((w) => w.includes("gửi kèm"))) throw new Error("thiếu cảnh báo gửi kèm file");
});

test("thiếu cả videoBase64 lẫn videoFileName → lỗi rõ ràng", () => {
  let threw = false;
  try { buildSharePage({ title: "X", spec: spec(), videoMime: "video/mp4" }); } catch (e) { threw = (e as Error).message.includes("Cần videoBase64"); }
  if (!threw) throw new Error("không báo lỗi khi thiếu video");
});

test("video embedded vượt 100MB → lỗi và gợi ý linked", () => {
  // Ngưỡng là 100 MiB = 104.857.600 byte video ≈ 139.810.134 ký tự base64.
  let threw = false;
  try {
    buildSharePage({ title: "X", spec: spec(), videoMime: "video/mp4", videoBase64: "A".repeat(140_000_000) });
  } catch (e) { threw = (e as Error).message.includes("linked"); }
  if (!threw) throw new Error("không chặn video vượt ngưỡng");
});

test("project trống: vẫn ra trang, bảng ghi rõ chưa có clip", () => {
  const empty = { version: "0.2.0", meta: { name: "Trống", width: 1280, height: 720, fps: 30 }, tracks: [] } as unknown as VideoSpec;
  const { html } = buildSharePage({ title: "Trống", spec: empty, videoMime: "video/mp4", videoBase64: "AAAA" });
  if (!html.includes("chưa có clip")) throw new Error("thiếu dòng project trống");
});

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
if (fail > 0) {
  console.error(`Thua ở: ${failedNames.join(", ")}`);
  process.exitCode = 1;
}
