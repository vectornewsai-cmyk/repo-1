"use strict";
/* Phase 9 đợt 2 — test validateTemporal/validateFeather của bridge bgremove.
 * Chạy: node test/test-bgremove-smooth.cjs  (không cần Python, model, server)
 * Không spawn bgremove.py thật: chỉ test lớp validate + kiểm tra rằng
 * runAttempt truyền --temporal/--feather (đọc source, vì spawn không export).
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { validateTemporal, validateFeather } = require("../src/bgremove");

assert.strictEqual(validateTemporal(undefined), 0.4, "temporal mặc định 0.4");
assert.strictEqual(validateTemporal(""), 0.4);
assert.strictEqual(validateTemporal("0"), 0);
assert.strictEqual(validateTemporal(0.9), 0.9);
assert.throws(() => validateTemporal("1.5"), /temporal/);
assert.throws(() => validateTemporal("abc"), /temporal/);
assert.strictEqual(validateFeather(undefined), 1, "feather mặc định 1");
assert.strictEqual(validateFeather("0"), 0);
assert.strictEqual(validateFeather(2), 2);
assert.throws(() => validateFeather("1.5"), /feather/);
assert.throws(() => validateFeather("-1"), /feather/);
assert.throws(() => validateFeather("9"), /feather/);

const src = fs.readFileSync(path.join(__dirname, "..", "src", "bgremove.js"), "utf8");
assert.ok(src.includes('"--temporal", String(temporal)'),
  "runAttempt phải truyền --temporal cho bgremove.py");
assert.ok(src.includes('"--feather", String(feather)'),
  "runAttempt phải truyền --feather cho bgremove.py");
const indexSrc = fs.readFileSync(path.join(__dirname, "..", "src", "index.js"), "utf8");
assert.ok(indexSrc.includes("validateTemporal(req.body.temporal)"),
  "endpoint /api/bgremove phải validate temporal từ client");
assert.ok(indexSrc.includes("validateFeather(req.body.feather)"),
  "endpoint /api/bgremove phải validate feather từ client");
assert.ok(indexSrc.includes("temporal, feather })") ||
        indexSrc.includes("temporal, feather}"),
  "endpoint phải truyền temporal/feather vào runBgremove");

console.log("PASS: bridge bgremove smooth validators + wiring (test-bgremove-smooth)");
