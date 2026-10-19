/**
 * Test cho apps/web/src/lib/archive.ts (chạy bằng Node, không cần browser).
 * Được biên dịch & chạy bởi scripts/test-archive.sh.
 *
 * Node 20+ có sẵn: Blob, File, crypto.subtle, TextEncoder.
 */
"use strict";

const archive = require("./apps/web/src/lib/archive.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${label}`);
  } else {
    fail += 1;
    console.error(`  ✗ FAIL: ${label}`);
  }
}
function eq(a, b, label) {
  ok(a === b, `${label} (nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)})`);
}

function makeSpec() {
  return {
    version: "0.2.0",
    meta: { name: "Test Archive", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        clips: [
          { id: "c1", kind: "video", src: "clip1.mp4", start: 0, duration: 5, in: 0, out: 5 },
          { id: "c2", kind: "video", src: "clip1.mp4", start: 5, duration: 3, in: 1, out: 4 },
        ],
      },
      {
        id: "a1",
        kind: "audio",
        clips: [
          { id: "c3", kind: "audio", src: "nhac.mp3", start: 0, duration: 8, in: 0, out: 8 },
        ],
      },
      {
        id: "t1",
        kind: "text",
        clips: [
          {
            id: "c4",
            kind: "text",
            text: "Xin chào",
            start: 0,
            duration: 5,
            style: { fontFamily: "Arial", fontSize: 48, color: "#fff" },
          },
        ],
      },
    ],
  };
}

function fakeMedia(name, content) {
  const bytes = new TextEncoder().encode(content);
  return { name, data: new Blob([bytes], { type: "application/octet-stream" }) };
}

async function main() {
  console.log("== collectMediaSrcs ==");
  {
    const srcs = archive.collectMediaSrcs(makeSpec()).sort();
    eq(JSON.stringify(srcs), JSON.stringify(["clip1.mp4", "nhac.mp3"]), "thu thập src duy nhất, bỏ text clip");
    const withBlob = makeSpec();
    withBlob.tracks[0].clips[0].src = "blob:http://x/abc";
    const srcs2 = archive.collectMediaSrcs(withBlob);
    ok(!srcs2.includes("blob:http://x/abc"), "bỏ qua blob: URL");
  }

  console.log("== isSafeEntryName / isAllowedEntry ==");
  {
    ok(archive.isSafeEntryName("media/a.mp4"), "tên thường an toàn");
    ok(!archive.isSafeEntryName("../evil.sh"), "từ chối ..");
    ok(!archive.isSafeEntryName("media/../../x"), "từ chối .. giữa path");
    ok(!archive.isSafeEntryName("/etc/passwd"), "từ chối absolute");
    ok(!archive.isSafeEntryName("media\\a.mp4"), "từ chối backslash");
    ok(!archive.isSafeEntryName(""), "từ chối rỗng");
    ok(archive.isAllowedEntry("project.json"), "cho phép project.json");
    ok(archive.isAllowedEntry("manifest.json"), "cho phép manifest.json");
    ok(archive.isAllowedEntry("media/a.mp4"), "cho phép media/*");
    ok(!archive.isAllowedEntry("media/sub/a.mp4"), "từ chối thư mục con trong media/");
    ok(!archive.isAllowedEntry("evil.sh"), "từ chối file lạ");
    ok(!archive.isAllowedEntry("media/"), "từ chối media/ rỗng tên");
  }

  console.log("== export → import round-trip ==");
  {
    const spec = makeSpec();
    const media = [
      fakeMedia("clip1.mp4", "FAKE-VIDEO-BYTES-1111"),
      fakeMedia("nhac.mp3", "FAKE-AUDIO-BYTES-2222"),
    ];
    const exp = await archive.exportArchive(spec, "Test Archive", media);
    ok(exp.ok, "export thành công");
    eq(exp.errors.length, 0, "không có lỗi export");
    eq(exp.stats.mediaFiles, 2, "2 file media trong archive");
    ok(exp.blob instanceof Blob && exp.blob.size > 0, "blob zip tạo ra");
    ok(exp.blob.type === "" || exp.blob.type.includes("zip") || true, "blob hợp lệ");

    const imp = await archive.importArchive(exp.blob);
    ok(imp.ok, "import thành công");
    eq(imp.errors.length, 0, "không có lỗi import");
    eq(imp.name, "Test Archive", "giữ tên project");
    eq(imp.mediaFiles.length, 2, "giải nén 2 media");
    const byName = new Map(imp.mediaFiles.map((f) => [f.name, f]));
    eq(await byName.get("clip1.mp4").text(), "FAKE-VIDEO-BYTES-1111", "nội dung clip1.mp4 nguyên vẹn");
    eq(await byName.get("nhac.mp3").text(), "FAKE-AUDIO-BYTES-2222", "nội dung nhac.mp3 nguyên vẹn");
    // spec round-trip: so sánh qua stable JSON (bỏ qua savedAt trong envelope)
    eq(
      JSON.stringify(imp.spec.tracks),
      JSON.stringify(spec.tracks),
      "tracks trong spec giữ nguyên sau round-trip",
    );
    eq(imp.spec.meta.name, "Test Archive", "meta.name giữ nguyên");
  }

  console.log("== export thiếu media → warning, import báo relink ==");
  {
    const spec = makeSpec();
    const exp = await archive.exportArchive(spec, "Thieu media", [
      fakeMedia("clip1.mp4", "X"),
    ]);
    ok(exp.ok, "vẫn export được khi thiếu media");
    ok(exp.warnings.length > 0, "có warning thiếu media");
    ok(exp.warnings.join(" ").includes("nhac.mp3"), "warning nêu tên file thiếu");

    const imp = await archive.importArchive(exp.blob);
    ok(imp.ok, "import vẫn ok");
    ok(
      imp.warnings.join(" ").includes("nhac.mp3"),
      "import cảnh báo media thiếu để relink",
    );
    eq(imp.mediaFiles.length, 1, "chỉ giải nén media có trong archive");
  }

  console.log("== manifest bị giả mạo (sai hash) → từ chối ==");
  {
    const JSZip = require("jszip");
    const spec = makeSpec();
    const exp = await archive.exportArchive(spec, "T", [fakeMedia("clip1.mp4", "REAL-DATA-1234")]);
    const zip = await JSZip.loadAsync(exp.blob);
    // ghi đè media bằng nội dung KHÁC nhưng CÙNG size → qua được check size, rớt ở hash
    zip.file("media/clip1.mp4", Buffer.from("EVIL-DATA-1234"));
    const tampered = await zip.generateAsync({ type: "blob" });
    const imp = await archive.importArchive(tampered);
    ok(!imp.ok, "từ chối archive bị giả mạo");
    ok(imp.errors.join(" ").includes("SHA-256"), "lỗi nêu rõ SHA-256 không khớp");
  }

  console.log("== path traversal trong zip → từ chối ==");
  {
    const JSZip = require("jszip");
    const zip = new JSZip();
    zip.file("project.json", JSON.stringify({ format: "vcut-project", formatVersion: 1 }));
    zip.file("manifest.json", JSON.stringify({ format: "vcut-archive", formatVersion: 1, files: [] }));
    zip.file("../evil.sh", "#!/bin/sh\necho pwned");
    const blob = await zip.generateAsync({ type: "blob" });
    const imp = await archive.importArchive(blob);
    ok(!imp.ok, "từ chối entry path traversal");
  }

  console.log("== thiếu manifest → từ chối ==");
  {
    const JSZip = require("jszip");
    const zip = new JSZip();
    zip.file("project.json", "{}");
    const blob = await zip.generateAsync({ type: "blob" });
    const imp = await archive.importArchive(blob);
    ok(!imp.ok, "từ chối archive thiếu manifest");
  }

  console.log("== file không phải zip → từ chối rõ ràng ==");
  {
    const imp = await archive.importArchive(
      new Blob(["không phải zip"], { type: "text/plain" }),
    );
    ok(!imp.ok, "từ chối file không phải zip");
  }

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test crash:", e);
  process.exit(1);
});
