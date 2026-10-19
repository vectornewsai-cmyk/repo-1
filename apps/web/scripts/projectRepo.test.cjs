/**
 * Test cho apps/web/src/lib/projectRepo.ts (chạy bằng Node, không cần browser).
 * Được biên dịch & chạy bởi scripts/test-project-repo.sh.
 *
 * Stub localStorage trong bộ nhớ trước khi require module thật.
 */
"use strict";

const memStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (memStore.has(k) ? memStore.get(k) : null),
  setItem: (k, v) => memStore.set(k, String(v)),
  removeItem: (k) => memStore.delete(k),
  clear: () => memStore.clear(),
};

const repo = require("./out/apps/web/src/lib/projectRepo.js");

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) {
    pass += 1;
  } else {
    fail += 1;
    console.error(`  ✗ FAIL: ${label}`);
  }
}
function eq(a, b, label) {
  ok(a === b, `${label} (nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)})`);
}

function makeSpec(name) {
  return {
    version: "0.2.0",
    meta: { name: name || "Test", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1",
        kind: "video",
        label: "Video 1",
        clips: [
          { kind: "video", id: "c1", src: "clip.mp4", start: 0, duration: 5, in: 0, out: 5 },
        ],
      },
      {
        id: "t1",
        kind: "text",
        label: "Chữ 1",
        clips: [{ kind: "text", id: "c2", text: "Xin chào", start: 1, duration: 2 }],
      },
    ],
  };
}

/** Spec theo schema cũ 0.1.0 (để test migration P0-12). */
function makeSpec010(name) {
  const s = makeSpec(name);
  s.version = "0.1.0";
  return s;
}

console.log("== serializeProject ==");
{
  const { json, envelope, warnings } = repo.serializeProject(makeSpec("Demo"), "Demo");
  eq(envelope.format, "vcut-project", "format");
  eq(envelope.formatVersion, 1, "formatVersion");
  eq(envelope.appVersion, "0.1.0", "appVersion");
  eq(envelope.specVersion, "0.2.0", "specVersion");
  eq(envelope.name, "Demo", "name");
  ok(!Number.isNaN(Date.parse(envelope.savedAt)), "savedAt là ISO date");
  eq(warnings.length, 0, "không warning khi spec sạch");
  const parsed = JSON.parse(json);
  eq(parsed.format, "vcut-project", "json parse được và giữ format");
}

console.log("== specHash ổn định ==");
{
  const a = makeSpec("A");
  const b = makeSpec("A");
  eq(repo.specHash(a), repo.specHash(b), "cùng nội dung → cùng hash");
  const c = makeSpec("B");
  ok(repo.specHash(a) !== repo.specHash(c), "khác tên → khác hash");
  // thứ tự key khác nhau vẫn cùng hash
  const reordered = { tracks: a.tracks, meta: a.meta, version: a.version };
  eq(repo.specHash(a), repo.specHash(reordered), "thứ tự key không ảnh hưởng hash");
}

console.log("== parseProjectText: envelope hợp lệ ==");
{
  const { json } = repo.serializeProject(makeSpec("Mở lại"), "Mở lại");
  const res = repo.parseProjectText(json);
  eq(res.ok, true, "ok");
  eq(res.name, "Mở lại", "giữ tên project");
  eq(res.spec.meta.name, "Mở lại", "spec.meta.name khớp");
  eq(res.errors.length, 0, "không lỗi");
}

console.log("== parseProjectText: spec trần (tương thích ngược) ==");
{
  const res = repo.parseProjectText(JSON.stringify(makeSpec("Trần")));
  eq(res.ok, true, "vẫn đọc được spec trần");
  ok(res.warnings.some((w) => w.includes("định dạng cũ")), "có cảnh báo định dạng cũ");
}

console.log("== parseProjectText: file hỏng ==");
{
  let res = repo.parseProjectText("không phải json {{{");
  eq(res.ok, false, "JSON sai → ok=false");
  ok(res.errors.length > 0, "có lỗi chi tiết");

  res = repo.parseProjectText(JSON.stringify({ version: "9.9.9", meta: {}, tracks: [] }));
  eq(res.ok, false, "sai version → ok=false");
  ok(res.errors[0].includes("9.9.9"), "lỗi nêu rõ version");

  res = repo.parseProjectText(JSON.stringify({ version: "0.1.0" }));
  eq(res.ok, false, "thiếu meta/tracks → ok=false");

  const bad = makeSpec("X");
  delete bad.tracks[0].clips[0].src;
  res = repo.parseProjectText(JSON.stringify(bad));
  eq(res.ok, false, "clip thiếu src → ok=false");
  ok(res.errors.some((e) => e.includes("tracks[0].clips[0]") && e.includes("src")), "lỗi chỉ đúng vị trí clip");

  const badKind = makeSpec("X");
  badKind.tracks[0].kind = "hologram";
  res = repo.parseProjectText(JSON.stringify(badKind));
  eq(res.ok, false, "track kind lạ → ok=false");
}

console.log("== parseProjectText: cảnh báo blob: URL ==");
{
  const s = makeSpec("Blob");
  s.tracks[0].clips[0].src = "blob:http://localhost/abc-123";
  const res = repo.parseProjectText(JSON.stringify({ format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.1.0", savedAt: new Date().toISOString(), name: "Blob", spec: s }));
  eq(res.ok, true, "blob: URL không chặn mở file");
  ok(res.warnings.some((w) => w.includes("blob:")), "có cảnh báo blob: URL");
  const w2 = repo.findBlobWarnings(s);
  eq(w2.length, 1, "findBlobWarnings phát hiện 1 clip");
}

console.log("== autosave round-trip ==");
{
  memStore.clear();
  const s = makeSpec("Auto");
  repo.autosaveNow(s, "Auto");
  const back = repo.loadAutosave();
  ok(back !== null, "loadAutosave trả về dữ liệu");
  eq(back.name, "Auto", "giữ tên");
  eq(back.spec.tracks.length, 2, "giữ tracks");
  ok(typeof back.savedAt === "string" && back.savedAt.length > 0, "có savedAt");
  ok(repo.getLastAutosaveAt() !== null, "getLastAutosaveAt có giá trị");

  memStore.set(repo.AUTOSAVE_KEY, "{ hỏng");
  eq(repo.loadAutosave(), null, "autosave hỏng → null, không crash");

  memStore.clear();
  eq(repo.loadAutosave(), null, "không có autosave → null");
}

console.log("== isDirty / markSaved ==");
{
  const empty = { version: "0.2.0", meta: { name: "Dự án mới", width: 1280, height: 720, fps: 30 }, tracks: [] };
  // reset trạng thái module bằng cách markSaved một spec khác rồi kiểm tra lại
  repo.markSaved(empty);
  eq(repo.isDirty(empty), false, "vừa markSaved → không dirty");
  const changed = makeSpec("Đổi");
  eq(repo.isDirty(changed), true, "spec khác → dirty");
  repo.markSaved(changed);
  eq(repo.isDirty(changed), false, "markSaved lại → sạch");
}

console.log("== parseProjectText: image clip (P1.1) ==");
{
  const s = makeSpec("Img");
  s.tracks.push({
    id: "i1",
    kind: "image",
    label: "Ảnh 1",
    clips: [{ kind: "image", id: "c3", src: "photo.png", start: 0, duration: 3, fit: "cover" }],
  });
  const res = repo.parseProjectText(JSON.stringify(s));
  eq(res.ok, true, "image clip hợp lệ → ok");
  const bad = makeSpec("ImgBad");
  bad.tracks.push({ id: "i1", kind: "image", label: "x", clips: [{ kind: "image", id: "c3", start: 0, duration: 3 }] });
  const res2 = repo.parseProjectText(JSON.stringify(bad));
  eq(res2.ok, false, "image clip thiếu src → ok=false");
}

console.log("== parseProjectText: migrate 0.1.0 → 0.2.0 (P0-12) ==");
{
  // Envelope định dạng 0.1.0 đầy đủ (như file do app cũ lưu) → tự migrate
  const env010 = {
    format: "vcut-project",
    formatVersion: 1,
    appVersion: "0.1.0",
    specVersion: "0.1.0",
    savedAt: new Date().toISOString(),
    name: "Cũ",
    spec: makeSpec010("Cũ"),
  };
  const res = repo.parseProjectText(JSON.stringify(env010));
  eq(res.ok, true, "file 0.1.0 cũ vẫn mở được");
  eq(res.name, "Cũ", "giữ tên project");
  eq(res.spec.version, "0.2.0", "spec được nâng cấp lên 0.2.0");
  eq(res.spec.tracks.length, 2, "giữ nguyên tracks");
  eq(res.spec.tracks[0].clips[0].src, "clip.mp4", "giữ nguyên dữ liệu clip");
  eq(res.spec.tracks[1].clips[0].text, "Xin chào", "giữ nguyên text clip");
  ok(
    res.warnings.some((w) => w.includes("0.1.0") && w.includes("nâng cấp")),
    "có cảnh báo đã tự động nâng cấp",
  );

  // Spec trần 0.1.0 (không envelope) → cũng migrate
  const res2 = repo.parseProjectText(JSON.stringify(makeSpec010("Trần cũ")));
  eq(res2.ok, true, "spec trần 0.1.0 mở được");
  eq(res2.spec.version, "0.2.0", "spec trần được nâng cấp");

  // File 0.2.0 hiện tại → không có cảnh báo migrate
  const cur = repo.parseProjectText(JSON.stringify(makeSpec("Mới")));
  eq(cur.ok, true, "file 0.2.0 mở bình thường");
  ok(
    !cur.warnings.some((w) => w.includes("nâng cấp")),
    "không cảnh báo nâng cấp khi đã ở version hiện tại",
  );

  // Version quá cũ (không có migration path) → từ chối rõ ràng
  const tooOld = makeSpec010("X");
  tooOld.version = "0.0.5";
  const res3 = repo.parseProjectText(JSON.stringify(tooOld));
  eq(res3.ok, false, "version 0.0.5 → ok=false");
  ok(res3.errors[0].includes("0.0.5"), "lỗi nêu rõ version không hỗ trợ");

  // Version mới hơn app → từ chối với gợi ý update
  const newer = makeSpec010("Y");
  newer.version = "9.9.9";
  const res4 = repo.parseProjectText(JSON.stringify(newer));
  eq(res4.ok, false, "version 9.9.9 → ok=false");
  ok(res4.errors[0].includes("9.9.9"), "lỗi nêu rõ version mới hơn app");
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
