"use strict";
/**
 * test-silence.cjs — test server/bridge/src/silence.js (R1-084).
 * Unit test validate + runSilence với file audio thật (tạo bằng ffmpeg).
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const {
  validateNoiseDb,
  validateMinDur,
  validateSilences,
  silenceAvailable,
  runSilence,
} = require("../src/silence");

let n = 0;
function check(name, cond) {
  n++;
  assert.ok(cond, `FAIL: ${name}`);
  console.log(`  ✓ ${name}`);
}

function makeAudio(wavPath) {
  // 6s: [0-2s sine][2-4s lặng][4-6s sine]
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-sil-"));
  const s1 = path.join(tmp, "s1.wav");
  const s2 = path.join(tmp, "s2.wav");
  const sil = path.join(tmp, "sil.wav");
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
    "-i", "sine=frequency=440:duration=2:sample_rate=44100",
    "-af", "volume=-20dB", s1]);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
    "-i", "sine=frequency=440:duration=2:sample_rate=44100",
    "-af", "volume=-20dB", s2]);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
    "-i", "anullsrc=r=44100:cl=mono:d=2", sil]);
  const lst = path.join(tmp, "list.txt");
  fs.writeFileSync(lst, [`file '${s1}'`, `file '${sil}'`, `file '${s2}'`].join("\n"));
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0",
    "-i", lst, "-c:a", "pcm_s16le", wavPath]);
  fs.rmSync(tmp, { recursive: true, force: true });
}

(async () => {
  console.log("== [1] validate ==");
  check("noise mặc định -35", validateNoiseDb(undefined) === -35);
  check("noise -40 ok", validateNoiseDb("-40") === -40);
  let threw = false;
  try { validateNoiseDb("-100"); } catch { threw = true; }
  check("noise -100 → throw", threw);
  threw = false;
  try { validateNoiseDb("abc"); } catch { threw = true; }
  check("noise 'abc' → throw", threw);
  check("minDur mặc định 0.5", validateMinDur(undefined) === 0.5);
  threw = false;
  try { validateMinDur("99"); } catch { threw = true; }
  check("minDur 99 → throw", threw);

  console.log("== [2] validateSilences ==");
  {
    const v = validateSilences([
      { start: 2, end: 4, duration: 2 },
      { start: "x", end: 5 },
      { start: 6, end: 5 },
    ]);
    check("bỏ entry hỏng", v.length === 1 && v[0].start === 2);
    const m = validateSilences([
      { start: 2, end: 5 }, { start: 4, end: 7 },
    ]);
    check("gộp giao nhau", m.length === 1 && m[0].end === 7);
    threw = false;
    try { validateSilences("không phải mảng"); } catch { threw = true; }
    check("không phải mảng → throw", threw);
  }

  console.log("== [3] silenceAvailable ==");
  {
    const a = silenceAvailable();
    check("silence.py tồn tại", a.available === true);
  }

  console.log("== [4] runSilence với audio thật ==");
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-siltest-"));
    const wav = path.join(tmp, "t.wav");
    makeAudio(wav);
    const res = await runSilence({ inputPath: wav, noiseDb: -40, minDur: 0.5 });
    console.log(`   silences: ${JSON.stringify(res.silences)}`);
    check("phát hiện 1 khoảng lặng", res.silences.length === 1);
    check("bắt đầu ~2s", Math.abs(res.silences[0].start - 2) < 0.15);
    check("kết thúc ~4s", Math.abs(res.silences[0].end - 4) < 0.15);
    check("audioDuration ~6s", Math.abs(res.audioDurationSec - 6) < 0.3);
    check("keep có 2 đoạn", res.keep.length === 2);
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log("== [5] lỗi ==");
  {
    let err = null;
    try {
      await runSilence({ inputPath: "tương/đối.wav", noiseDb: -35, minDur: 0.5 });
    } catch (e) { err = e; }
    check("path tương đối → reject", !!err);
    err = null;
    try {
      await runSilence({ inputPath: "/không/tồn/tại.wav", noiseDb: -35, minDur: 0.5 });
    } catch (e) { err = e; }
    check("file không tồn tại → reject", !!err);
  }

  console.log();
  console.log("=".repeat(42));
  console.log(`🎉 SILENCE BRIDGE PASS: ${n} assertions`);
})().catch((e) => {
  console.error("❌ FAIL:", e.message);
  process.exit(1);
});
