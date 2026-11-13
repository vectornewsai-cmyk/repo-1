#!/usr/bin/env node
/**
 * r80h3-d3-select.test.mjs — Phase 9 đợt 80, luồng H3 (probe d):
 * chứng minh hành vi cũ của D3 là SAI và bản sửa FAIL rõ là đúng.
 *
 * Bối cảnh (LIMITS G5 §7a): noise v1 temporal, metadata chưa tải nên
 * duration của element đang đo là NaN; srcKey là blob URL (không chứa
 * tên file) nên khớp srcKey cũng trượt; bản cũ fallback im lặng về
 * els[0] (element textsmall) → D3 đọc nhầm element mà vẫn PASS giả
 * (rawHash noise = da4264e1 = hash của textsmall).
 *
 * Hai hàm dưới đây sao chép ĐÚNG biểu thức chọn element trong RAW_FN:
 *  - selectOld: bản trước H3 (r79g5-fullpixel-headed.mjs trước khi sửa).
 *  - selectNew: bản sau H3 (không còn `|| els[0]`).
 * Ngoài ra kiểm tra tĩnh: cả 2 script headed (r79g5 + r80h3) đều không
 * còn fallback els[0] và có chuỗi fail rõ "D3 FAIL rõ".
 *
 * Chạy: node --test apps/web/scripts/r80h3-d3-select.test.mjs
 * KHÔNG push/tag/binary. Không sửa code production.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));

// Biểu thức chọn element — sao chép verbatim từ RAW_FN.
function selectOld(els, wantDur, wantSrc) {
  return els.find((e) => Math.abs((e.duration || 0) - wantDur) < 0.05)
    || els.find((e) => (e.dataset?.srcKey || "").includes(wantSrc))
    || els[0];
}
function selectNew(els, wantDur, wantSrc) {
  return els.find((e) => Math.abs((e.duration || 0) - wantDur) < 0.05)
    || els.find((e) => (e.dataset?.srcKey || "").includes(wantSrc))
    || null;
}

// Pool giả đúng kịch bản G5 §7a: 5 element, element noise (thứ 4) có
// duration NaN vì metadata chưa tải; srcKey đều là blob URL.
function fakePoolNaN() {
  const mk = (name, duration) => ({
    name, duration, dataset: { srcKey: `blob:http://127.0.0.1:5660/${name}-uuid` },
    hash: `hash-${name}`,
  });
  return [
    mk("textsmall", 4.0), mk("gradient", 4.1), mk("photo", 4.2),
    mk("noise", NaN), mk("lineart", 4.4),
  ];
}
function fakePoolOk() {
  const p = fakePoolNaN();
  p[3].duration = 4.3;
  return p;
}

test("hành vi cũ SAI: duration NaN → fallback els[0] (đọc nhầm element)", () => {
  const els = fakePoolNaN();
  const got = selectOld(els, 4.3, "noise-1280.mp4");
  assert.equal(got.name, "textsmall", "bản cũ trả element đầu tiên (textsmall) thay vì noise");
  assert.notEqual(got.hash, "hash-noise");
});

test("hành vi cũ gây D3 PASS giả: plain và noise05 cùng đọc els[0]", () => {
  const els = fakePoolNaN();
  // D3 so hash plain vs hash noise05 ở cùng playhead — cả 2 đều đọc nhầm
  // cùng 1 element (els[0]) nên hash khớp nhau → PASS giả.
  const rawPlain = selectOld(els, 4.3, "noise-1280.mp4");
  const rawNoise = selectOld(els, 4.3, "noise-1280.mp4");
  assert.equal(rawPlain.hash, rawNoise.hash, "cùng element → cùng hash → D3 PASS giả");
  assert.equal(rawPlain.name, "textsmall");
});

test("bản sửa ĐÚNG: duration NaN → null (fail rõ, không đọc nhầm)", () => {
  const els = fakePoolNaN();
  const got = selectNew(els, 4.3, "noise-1280.mp4");
  assert.equal(got, null, "bản mới trả null để RAW_FN fail rõ thay vì đọc nhầm");
});

test("bản sửa giữ hành vi đúng khi metadata đã tải (duration finite)", () => {
  const els = fakePoolOk();
  assert.equal(selectNew(els, 4.3, "noise-1280.mp4").name, "noise");
  assert.equal(selectNew(els, 4.0, "textsmall-1280.mp4").name, "textsmall");
  assert.equal(selectNew(els, 4.4, "lineart-1280.mp4").name, "lineart");
  // Bản cũ cũng đúng trong trường hợp này — sửa chỉ đổi đường lỗi.
  assert.equal(selectOld(els, 4.3, "noise-1280.mp4").name, "noise");
});

test("pool rỗng: cả 2 bản đều không trả element (RAW_FN fail ở bước sau)", () => {
  assert.equal(selectOld([], 4.3, "noise-1280.mp4"), undefined);
  assert.equal(selectNew([], 4.3, "noise-1280.mp4"), null);
});

test("kiểm tra tĩnh: script headed r79g5 + r80h3 đã bỏ fallback els[0]", () => {
  for (const f of ["r79g5-fullpixel-headed.mjs", "r80h3-fullpixel-headed.mjs"]) {
    const src = fs.readFileSync(path.join(SCRIPTS, f), "utf8");
    assert.ok(!src.includes("|| els[0]"), `${f} vẫn còn fallback els[0]`);
    assert.ok(src.includes("D3 FAIL rõ"), `${f} thiếu chuỗi fail rõ của D3`);
    assert.ok(src.includes("không khớp video element (wantDur="), `${f} thiếu reason fail rõ`);
  }
});
