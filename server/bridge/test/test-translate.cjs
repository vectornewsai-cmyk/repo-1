// test-translate.cjs — unit test cho R1-080 (dịch phụ đề) trong
// server/bridge/src/caption.js. Không cần model faster-whisper —
// runTranslate được test qua stub test-translate-stub.py (env TRANSLATE_PY).
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  TRANSLATE_TARGET_LANGS,
  DEFAULT_TRANSLATE_TARGET,
  TRANSLATE_PHASE_LABELS,
  translateConfigFromEnv,
  validateTranslateTarget,
  validateLang,
  translatePhaseFromLine,
  translateAvailable,
  runTranslate,
} = require("../src/caption");

const STUB = path.join(__dirname, "test-translate-stub.py");

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
async function asyncOk(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

console.log("== [1] validateTranslateTarget ==");
ok("mặc định en khi không truyền", () => {
  assert.equal(validateTranslateTarget(undefined), "en");
  assert.equal(validateTranslateTarget(""), "en");
});
ok("en hợp lệ (chuẩn hóa chữ hoa)", () => {
  assert.equal(validateTranslateTarget("en"), "en");
  assert.equal(validateTranslateTarget(" EN "), "en");
});
ok("ngôn ngữ đích khác → throw rõ ràng", () => {
  assert.throws(() => validateTranslateTarget("vi"), /chưa hỗ trợ/);
  assert.throws(() => validateTranslateTarget("ja"), /chưa hỗ trợ/);
});
ok("injection qua target bị chặn", () => {
  assert.throws(() => validateTranslateTarget("--lang vi"), /chưa hỗ trợ/);
});
ok(`DEFAULT_TRANSLATE_TARGET=${DEFAULT_TRANSLATE_TARGET} nằm trong whitelist`, () => {
  assert.ok(TRANSLATE_TARGET_LANGS.includes(DEFAULT_TRANSLATE_TARGET));
});

console.log("== [2] translatePhaseFromLine ==");
ok("nhận diện 3 phase của translate.py", () => {
  assert.equal(translatePhaseFromLine("[translate] trích audio từ x.mp4..."), "extract");
  assert.equal(translatePhaseFromLine("[translate] đang dịch (nguồn=vi -> en)..."), "translating");
  assert.equal(translatePhaseFromLine("[translate] xong: 5 captions..."), "group");
});
ok("dòng lạ → null (không nhầm với phase caption)", () => {
  assert.equal(translatePhaseFromLine("[caption] đang transcribe..."), null);
  assert.equal(translatePhaseFromLine("dòng rác"), null);
  assert.equal(translatePhaseFromLine(""), null);
});
ok("TRANSLATE_PHASE_LABELS đủ 4 phase", () => {
  for (const k of ["upload", "extract", "translating", "group"]) {
    assert.ok(TRANSLATE_PHASE_LABELS[k], k);
  }
});

console.log("== [3] translateAvailable ==");
ok("stub tồn tại → available", () => {
  const r = translateAvailable({ translatePy: STUB, pythonBin: "python3", timeoutMs: 60000 });
  assert.equal(r.available, true);
});
ok("script không tồn tại → available=false + reason rõ", () => {
  const r = translateAvailable({ translatePy: "/khong/co/file.py", pythonBin: "python3", timeoutMs: 60000 });
  assert.equal(r.available, false);
  assert.match(r.reason, /Không tìm thấy translate\.py/);
});
ok("translateConfigFromEnv đọc TRANSLATE_PY", () => {
  const cfg = translateConfigFromEnv({ TRANSLATE_PY: "/tmp/stub.py", TRANSLATE_TIMEOUT_MS: "90000" });
  assert.equal(cfg.translatePy, "/tmp/stub.py");
  assert.equal(cfg.timeoutMs, 90000);
});

(async () => {
  console.log("== [4] runTranslate qua stub (5 câu vi→en) ==");
  const tmpWav = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "vcut-tr-")), "t.wav");
  fs.writeFileSync(tmpWav, Buffer.alloc(100)); // stub chỉ cần file tồn tại
  const cfg = { pythonBin: "python3", translatePy: STUB, timeoutMs: 30000 };
  const phases = [];

  await asyncOk("dịch 5 câu vi→en → đúng nội dung", async () => {
    const res = await runTranslate({
      inputPath: tmpWav, lang: "vi", target: "en",
      onPhase: (p) => phases.push(p), config: cfg,
    });
    assert.equal(res.targetLanguage, "en");
    assert.equal(res.sourceLanguage, "vi");
    assert.equal(res.segments.length, 5);
    const texts = res.segments.map((s) => s.text);
    assert.deepEqual(texts, [
      "Hello everyone",
      "This is a subtitle test video",
      "Thanks for watching",
      "See you in the next video",
      "Goodbye",
    ]);
    // timing giữ nguyên từ stub
    assert.equal(res.segments[0].start, 0.5);
    assert.equal(res.segments[4].end, 14.3);
  });

  await asyncOk("phase stream đủ extract → translating → group", async () => {
    assert.deepEqual(phases, ["extract", "translating", "group"]);
  });

  await asyncOk("target lạ → throw trước khi spawn (đồng bộ, như validateLang)", async () => {
    assert.throws(
      () => runTranslate({ inputPath: tmpWav, lang: "vi", target: "vi", config: cfg }),
      /chưa hỗ trợ/
    );
  });

  await asyncOk("lang nguồn lạ → throw (dùng chung whitelist caption)", async () => {
    assert.throws(
      () => runTranslate({ inputPath: tmpWav, lang: "xx", target: "en", config: cfg }),
      /không hỗ trợ/
    );
  });

  await asyncOk("inputPath tương đối → reject", async () => {
    await assert.rejects(
      runTranslate({ inputPath: "relative/path.wav", lang: "vi", config: cfg }),
      /đường dẫn tuyệt đối/
    );
  });

  await asyncOk("stub fail (TRANSLATE_STUB_FAIL=1) → error rõ", async () => {
    const failCfg = { ...cfg };
    const origEnv = process.env.TRANSLATE_STUB_FAIL;
    process.env.TRANSLATE_STUB_FAIL = "1";
    try {
      await assert.rejects(
        runTranslate({ inputPath: tmpWav, lang: "vi", config: failCfg }),
        /translate\.py thoát mã 1/
      );
    } finally {
      if (origEnv === undefined) delete process.env.TRANSLATE_STUB_FAIL;
      else process.env.TRANSLATE_STUB_FAIL = origEnv;
    }
  });

  await asyncOk("stub empty (TRANSLATE_STUB_EMPTY=1) → báo video câm", async () => {
    const origEnv = process.env.TRANSLATE_STUB_EMPTY;
    process.env.TRANSLATE_STUB_EMPTY = "1";
    try {
      await assert.rejects(
        runTranslate({ inputPath: tmpWav, lang: "vi", config: cfg }),
        /Không dịch được câu nào/
      );
    } finally {
      if (origEnv === undefined) delete process.env.TRANSLATE_STUB_EMPTY;
      else process.env.TRANSLATE_STUB_EMPTY = origEnv;
    }
  });

  fs.rmSync(path.dirname(tmpWav), { recursive: true, force: true });
  console.log(`\n${"=".repeat(44)}\n${process.exitCode ? "❌" : "🎉"} TRANSLATE UNIT PASS: ${pass} assertions\n${"=".repeat(44)}`);
})();
