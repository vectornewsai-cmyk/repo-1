// test-caption.cjs — unit test cho server/bridge/src/caption.js (R1-072).
// Không cần model faster-whisper, không cần bridge đang chạy.
"use strict";

const assert = require("node:assert/strict");
const {
  CAPTION_LANGS,
  DEFAULT_LANG,
  PHASE_LABELS,
  captionConfigFromEnv,
  validateLang,
  validateSegments,
  phaseFromLine,
  captionAvailable,
} = require("../src/caption");

let pass = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

console.log("== [1] validateLang ==");
ok("mặc định vi khi không truyền", () => {
  assert.equal(validateLang(undefined), "vi");
  assert.equal(validateLang(""), "vi");
});
ok("chuẩn hóa chữ hoa + khoảng trắng", () => {
  assert.equal(validateLang(" VI "), "vi");
  assert.equal(validateLang("EN"), "en");
});
ok("auto hợp lệ", () => assert.equal(validateLang("auto"), "auto"));
ok("ngôn ngữ lạ → throw", () => {
  assert.throws(() => validateLang("xx"), /không hỗ trợ/);
  assert.throws(() => validateLang("vi; rm -rf /"), /không hỗ trợ/);
});
ok("injection qua argv bị chặn bởi whitelist", () => {
  assert.throws(() => validateLang("--model tiny"), /không hỗ trợ/);
});
ok(`DEFAULT_LANG=${DEFAULT_LANG} nằm trong whitelist`, () => {
  assert.ok(CAPTION_LANGS.includes(DEFAULT_LANG));
  assert.ok(CAPTION_LANGS.includes("en"));
  assert.ok(CAPTION_LANGS.includes("auto"));
});

console.log("== [2] validateSegments ==");
ok("segments hợp lệ giữ nguyên thứ tự + làm tròn", () => {
  const out = validateSegments([
    { start: 0.005, end: 2.345, text: "  Xin chào  " },
    { start: 3, end: 5.5, text: "Tạm biệt" },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].start, 0.01);
  assert.equal(out[0].end, 2.35);
  assert.equal(out[0].text, "Xin chào");
});
ok("sắp xếp theo start khi đầu vào lộn xộn", () => {
  const out = validateSegments([
    { start: 5, end: 6, text: "b" },
    { start: 1, end: 2, text: "a" },
  ]);
  assert.equal(out[0].text, "a");
  assert.equal(out[1].text, "b");
});
ok("bỏ qua segment hỏng (thiếu text, end <= start, start âm)", () => {
  const out = validateSegments([
    { start: 0, end: 1, text: "ok" },
    { start: 2, end: 3, text: "   " },
    { start: 4, end: 4, text: "zero" },
    { start: -1, end: 2, text: "neg" },
    { start: "x", end: 2, text: "nan" },
    null,
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].text, "ok");
});
ok("không phải mảng → throw", () => {
  assert.throws(() => validateSegments(null), /thiếu mảng/);
  assert.throws(() => validateSegments("abc"), /thiếu mảng/);
});
ok("text quá dài bị cắt 500 ký tự", () => {
  const out = validateSegments([{ start: 0, end: 1, text: "x".repeat(1000) }]);
  assert.equal(out[0].text.length, 500);
});

console.log("== [3] phaseFromLine ==");
ok("nhận diện 3 phase của caption.py", () => {
  assert.equal(phaseFromLine("[caption] trích audio từ a.mp4..."), "extract");
  assert.equal(phaseFromLine("[caption] đang transcribe (lang=vi)..."), "transcribe");
  assert.equal(phaseFromLine("[caption] xong: 12 captions..."), "group");
});
ok("dòng lạ → null", () => {
  assert.equal(phaseFromLine("hello"), null);
  assert.equal(phaseFromLine(""), null);
  assert.equal(phaseFromLine(null), null);
});
ok("mọi phase đều có nhãn tiếng Việt", () => {
  for (const p of ["upload", "extract", "transcribe", "group"]) {
    assert.ok(PHASE_LABELS[p], `thiếu nhãn cho phase ${p}`);
  }
});

console.log("== [4] captionConfigFromEnv / captionAvailable ==");
ok("env override python + timeout", () => {
  const cfg = captionConfigFromEnv({
    CAPTION_PYTHON: "/usr/bin/python9",
    CAPTION_PY: "/tmp/fake-caption.py",
    CAPTION_TIMEOUT_MS: "60000",
  });
  assert.equal(cfg.pythonBin, "/usr/bin/python9");
  assert.equal(cfg.captionPy, "/tmp/fake-caption.py");
  assert.equal(cfg.timeoutMs, 60000);
});
ok("timeout quá nhỏ → dùng default", () => {
  const cfg = captionConfigFromEnv({ CAPTION_TIMEOUT_MS: "100" });
  assert.ok(cfg.timeoutMs >= 30000);
});
ok("caption.py thật tồn tại trong repo", () => {
  const r = captionAvailable();
  assert.equal(r.available, true);
});
ok("script không tồn tại → available=false + reason", () => {
  const r = captionAvailable({ pythonBin: "python3", captionPy: "/khong/co/file.py", timeoutMs: 60000 });
  assert.equal(r.available, false);
  assert.ok(r.reason.includes("/khong/co/file.py"));
});

console.log(`\n==========================================\n🎉 CAPTION UNIT PASS: ${pass} assertions\n==========================================`);
