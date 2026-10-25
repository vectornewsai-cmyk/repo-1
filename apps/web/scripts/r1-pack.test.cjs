// r1-pack.test.cjs — test logic template pack (R1, Phase 9), chạy bằng Node sau
// khi tsc biên dịch module thật sang /tmp (xem test-r1-pack.sh). Không cần DOM:
// chỉ dùng resolvePackSpec/packMediaSeconds/firstTextOf + findUnresolvedMarkers.
"use strict";

const assert = require("node:assert/strict");
const { getPacks, resolvePackSpec, packMediaSeconds, firstTextOf } = require("./out/apps/web/src/lib/templatePack.js");
const { findUnresolvedMarkers } = require("./out/apps/web/src/lib/templateEngine.js");

let pass = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

/** Tên file stub cho placeholder media (render test thay bằng file thật sau). */
function stubNames(tpl) {
  const names = {};
  for (const p of tpl.template.placeholders) {
    if (p.kind === "video") names[p.id] = "testsrc.mp4";
    if (p.kind === "image") names[p.id] = "testimg.png";
  }
  return names;
}

console.log("== R1 template pack (logic) ==");
const packs = getPacks();
ok("đúng 6 pack tuyển", () => assert.equal(packs.length, 6));
for (const tpl of packs) {
  ok(`pack ${tpl.template.id}: resolve OK, không còn marker`, () => {
    const res = resolvePackSpec(tpl, stubNames(tpl));
    assert.equal(res.ok, true, res.ok ? "" : res.error);
    assert.deepEqual(findUnresolvedMarkers(res.spec), []);
  });
  ok(`pack ${tpl.template.id}: src media = đúng tên file stub`, () => {
    const res = resolvePackSpec(tpl, stubNames(tpl));
    const srcs = new Set();
    for (const tr of res.spec.tracks)
      for (const c of tr.clips) if (typeof c.src === "string") srcs.add(c.src);
    const names = stubNames(tpl);
    for (const id of Object.keys(names)) assert.ok(srcs.has(names[id]), `thiếu src ${names[id]}`);
  });
  ok(`pack ${tpl.template.id}: text clip giữ đúng default của template`, () => {
    const res = resolvePackSpec(tpl, stubNames(tpl));
    for (const p of tpl.template.placeholders) {
      if (p.kind !== "text") continue;
      const found = res.spec.tracks.some((tr) =>
        tr.clips.some((c) => c.kind === "text" && c.text === p.default),
      );
      assert.ok(found, `không thấy text default của placeholder ${p.id}`);
    }
  });
  ok(`pack ${tpl.template.id}: có câu chữ đầu tiên cho nút TTS`, () => {
    const res = resolvePackSpec(tpl, stubNames(tpl));
    const first = firstTextOf(res.spec);
    assert.ok(typeof first === "string" && first.length > 0);
  });
}
ok("packMediaSeconds: youtube-intro = độ dài clip video dài nhất", () => {
  const tpl = packs.find((t) => t.template.id === "youtube-intro");
  const vid = tpl.template.placeholders.find((p) => p.kind === "video");
  const secs = packMediaSeconds(tpl, vid.id);
  assert.ok(secs > 0 && secs <= tpl.template.durationSec, `secs=${secs}`);
});
ok("thiếu file cho placeholder media → lỗi rõ ràng", () => {
  const tpl = packs[0];
  const res = resolvePackSpec(tpl, {});
  assert.equal(res.ok, false);
});
ok("template có placeholder audio → lỗi rõ ràng (không sinh audio giả)", () => {
  const { TEMPLATES } = require("./out/apps/web/src/lib/templates.js");
  const lofi = TEMPLATES.find((t) => t.template.id === "lofi-visual");
  const res = resolvePackSpec(lofi, stubNames(lofi));
  assert.equal(res.ok, false);
  assert.match(res.error, /audio/);
});

console.log(`\n==========================================`);
console.log(`🎉 R1 PACK LOGIC PASS: ${pass} assertions`);
console.log(`==========================================`);
