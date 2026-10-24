// templates.test.cjs — test templateEngine.ts + 30 templates (R1-104/R1-105).
"use strict";

const assert = require("node:assert/strict");
const { applyTemplateValues, findUnresolvedMarkers } = require("./out/apps/web/src/lib/templateEngine.js");
const { TEMPLATES } = require("./out/apps/web/src/lib/templates.js");

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

console.log("== 30 templates ==");
ok("đúng 30 templates", () => {
  assert.equal(TEMPLATES.length, 30);
});

ok("mỗi template có id duy nhất + placeholders hợp lệ", () => {
  const ids = new Set();
  for (const t of TEMPLATES) {
    const m = t.template;
    assert.ok(m.id && !ids.has(m.id), "trùng/thiếu id: " + m.id);
    ids.add(m.id);
    assert.ok(m.name && m.description && m.category, m.id);
    assert.equal(m.version, "1.0.0");
    assert.equal(m.license, "MIT");
    assert.ok(Array.isArray(m.placeholders) && m.placeholders.length > 0, m.id);
    for (const p of m.placeholders) {
      assert.ok(["video", "image", "audio", "text"].includes(p.kind), p.id);
      assert.ok(p.default, "placeholder thiếu default: " + p.id);
    }
    assert.ok(m.durationSec > 0, m.id);
  }
});

ok("spec hợp lệ với giá trị mặc định (không còn marker, isVideoSpec pass)", () => {
  for (const t of TEMPLATES) {
    const res = applyTemplateValues(t, {});
    assert.ok(res.ok, `${t.template.id}: ${res.error}`);
    assert.equal(findUnresolvedMarkers(res.spec).length, 0, t.template.id);
    assert.equal(res.spec.version, "0.2.0");
    assert.ok(res.spec.meta.width > 0 && res.spec.meta.height > 0, t.template.id);
  }
});

ok("ghi đè giá trị text placeholder", () => {
  const t = TEMPLATES.find((x) => x.template.id === "youtube-intro");
  const res = applyTemplateValues(t, { title: "KÊNH TEST" });
  assert.ok(res.ok);
  const texts = res.spec.tracks.flatMap((tr) => tr.clips).filter((c) => c.kind === "text").map((c) => c.text);
  assert.ok(texts.includes("KÊNH TEST"), JSON.stringify(texts));
  // placeholder còn lại dùng default
  assert.ok(texts.some((x) => x === "Video mới mỗi tuần"));
});

ok("ghi đè giá trị media placeholder", () => {
  const t = TEMPLATES.find((x) => x.template.id === "slideshow");
  const res = applyTemplateValues(t, { photo1: "anh-cua-toi.jpg" });
  assert.ok(res.ok);
  const srcs = res.spec.tracks.flatMap((tr) => tr.clips).map((c) => c.src).filter(Boolean);
  assert.ok(srcs.includes("anh-cua-toi.jpg"));
  assert.ok(srcs.includes("photo-2.jpg"), "default còn lại phải giữ");
});

ok("chuỗi rỗng → dùng default", () => {
  const t = TEMPLATES.find((x) => x.template.id === "title-card");
  const res = applyTemplateValues(t, { title: "   " });
  assert.ok(res.ok);
  const texts = res.spec.tracks.flatMap((tr) => tr.clips).filter((c) => c.kind === "text").map((c) => c.text);
  assert.ok(texts.includes("CHƯƠNG MỘT"));
});

ok("meta.name được prefix tên template", () => {
  const t = TEMPLATES.find((x) => x.template.id === "tiktok-viral");
  const res = applyTemplateValues(t, {});
  assert.ok(res.ok);
  assert.ok(res.spec.meta.name.startsWith("TikTok dọc"), res.spec.meta.name);
});

ok("spec gốc không bị mutate", () => {
  const t = TEMPLATES.find((x) => x.template.id === "lyric-video");
  const before = JSON.stringify(t.spec);
  applyTemplateValues(t, { line1: "đổi rồi" });
  assert.equal(JSON.stringify(t.spec), before);
});

ok("phát hiện marker không khai báo", () => {
  const fake = {
    template: {
      id: "fake", name: "F", description: "F", category: "intro",
      version: "1.0.0", author: "x", license: "MIT", tags: [],
      aspect: "1920:1080", durationSec: 1,
      placeholders: [{ id: "title", kind: "text", label: "T", default: "D" }],
    },
    spec: {
      version: "0.2.0",
      meta: { name: "F", width: 1920, height: 1080, fps: 30 },
      tracks: [{
        id: "t1", kind: "text", clips: [{
          kind: "text", id: "c1", text: "{{khong_ton_tai}}",
          start: 0, duration: 1, style: { fontFamily: "x", fontSize: 10, color: "#fff" },
        }],
      }],
    },
  };
  const res = applyTemplateValues(fake, {});
  assert.ok(!res.ok);
  assert.ok(res.error.includes("khong_ton_tai"), res.error);
});

ok("aspect ratio đúng từng template", () => {
  const expect = {
    "youtube-intro": [1920, 1080], "youtube-outro": [1920, 1080],
    "tiktok-viral": [1080, 1920], "slideshow": [1920, 1080],
    "lyric-video": [1920, 1080], "lower-third": [1920, 1080],
    "title-card": [1920, 1080], "product-showcase": [1080, 1080],
    "travel-vlog-intro": [1920, 1080], "podcast-audiogram": [1080, 1080],
    "wedding-teaser": [1920, 1080], "food-reel": [1080, 1920],
    "gaming-highlight": [1080, 1920], "breaking-news": [1920, 1080],
    "quote-card": [1080, 1080], "tutorial-vertical": [1080, 1920],
    "unboxing": [1080, 1080], "fitness-promo": [1920, 1080],
    "lofi-visual": [1920, 1080], "album-teaser": [1080, 1080],
    "interview-cut": [1920, 1080], "audiobook-promo": [1080, 1080],
    "event-invite": [1080, 1920], "real-estate-tour": [1920, 1080],
    "recipe-card": [1080, 1920], "travel-diary": [1920, 1080],
    "birthday-card": [1080, 1080], "sale-banner": [1920, 1080],
    "documentary-title": [1920, 1080], "outro-creator": [1920, 1080],
  };
  for (const t of TEMPLATES) {
    const [w, h] = expect[t.template.id];
    assert.equal(t.spec.meta.width, w, t.template.id);
    assert.equal(t.spec.meta.height, h, t.template.id);
  }
});

console.log(`\n==========================================`);
console.log(`🎉 TEMPLATES PASS: ${pass} assertions`);
console.log(`==========================================`);
