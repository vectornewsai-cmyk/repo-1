// r86n7-verify3.mjs — Phase 9 đợt 86, luồng N7: xác minh CHỐT mô hình toán tử
// video (V1) trên toàn bộ 87 case + liệt kê pixel tie S-nguyên + đối chiếu
// 4 biến thể downscale. Chạy: node apps/web/scripts/r86n7-verify3.mjs
// Mô hình V1: S = (i+0,5-offDst)/fround(s); S_q = floor(16S)/16;
// kernel tam giác; float->uint8 CẮT NGỌN (trunc). Kết quả: 86/87 MAD đúng 0;
// phần dư duy nhất: sqw4-mid s=0,6 (16 pixel tại S=k+0,5), xem LIMITS N7 §5.
// Evidence JSON: hidden_files/round86-n7/r86n7-verify3.json (KHÔNG stage).
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
const H = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/";
const p7 = JSON.parse(fs.readFileSync(H + "round86-n7/r86n7-video-operator2.json", "utf8"));
const pd = JSON.parse(fs.readFileSync(H + "round86-n7/r86n7-downscale.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync(H + "round85-m2/r85m2-video-operator.json", "utf8"));
const w2 = JSON.parse(fs.readFileSync(H + "round85-m2/r85m2-wave.json", "utf8"));
function dec(b64, w, h) { return { w, h, data: Buffer.from(b64, "base64") }; }
function prof(dump, kind) { const { w, h, data } = dump; if (kind === "V") { const pr = new Float64Array(w); for (let x = 0; x < w; x++) { let s = 0; for (let y = 0; y < h; y++) s += data[(y * w + x) * 3]; pr[x] = s / h; } return pr; } const pr = new Float64Array(h); for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) s += data[(y * w + x) * 3]; pr[y] = s / w; } return pr; }
const tri = (x) => { const a = Math.abs(x); return a < 1 ? 1 - a : 0; };
const srcProf = (rgb, kind) => { const raw = fs.readFileSync(rgb); if (kind === "V") { const pr = new Float64Array(640); for (let x = 0; x < 640; x++) { let s = 0; for (let y = 170; y < 178; y++) s += raw[(y * 640 + x) * 3]; pr[x] = s / 8; } return pr; } const pr = new Float64Array(360); for (let y = 0; y < 360; y++) { let s = 0; for (let x = 310; x < 318; x++) s += raw[(y * 640 + x) * 3]; pr[y] = s / 8; } return pr; };
const M7 = H + "round86-n7/media/", M2 = H + "round85-m2/media/";
const all = [];
for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160], ["stepH255b", "H", 90]]) {
  const src = srcProf(M7 + name + ".rgb", kind);
  for (const sNom of p7.scales) { const d = p7[name].dumps["exp-high-video-s" + sNom]; const meas = prof(dec(d.rgbB64, d.w, d.h), kind); const dl = meas.length, st = dl / src.length; const c = Math.round(E * st); all.push({ tag: "up:" + name + " s" + sNom, src, meas, dl, srcLen: src.length, s: st, offX: 0, lo: Math.max(0, c - 60), hi: Math.min(dl, c + 60) }); }
}
for (const [name, kind] of [["sqw2-mid", "H"], ["sqw4-mid", "H"], ["sqw8-mid", "H"], ["sqw4x-mid", "V"], ["sqw4-640", "H"]]) {
  const b = dec(w2[name].dumps["B-1to1"].rgbB64, w2[name].dumps["B-1to1"].w, w2[name].dumps["B-1to1"].h); const src = prof(b, kind);
  for (const sNom of w2.scales) { const d = w2[name].dumps["exp-high-video-s" + sNom]; const meas = prof(dec(d.rgbB64, d.w, d.h), kind); const dl = meas.length, st = dl / src.length; let lo = 10, hi = dl - 10; if (name === "sqw4-640") { lo = Math.floor(200 * st); hi = Math.floor(350 * st); } all.push({ tag: "up:" + name + " s" + sNom, src, meas, dl, srcLen: src.length, s: st, offX: 0, lo, hi }); }
}
for (const [name, kind, E] of [["stepV-gray", "V", 320], ["stepH-gray", "H", 180], ["lineV-gray", "V", 320], ["lineH-gray", "H", 180]]) {
  const src = srcProf(M2 + name + ".rgb", kind);
  for (const sNom of [1.125, 1.5, 2.25, 3.0]) { const d = p2[name].dumps["exp-high-video-s" + sNom]; const meas = prof(dec(d.rgbB64, d.w, d.h), kind); const dl = meas.length, st = dl / src.length; const c = Math.round(E * st); all.push({ tag: "up:M2:" + name + " s" + sNom, src, meas, dl, srcLen: src.length, s: st, offX: 0, lo: Math.max(0, c - 60), hi: Math.min(dl, c + 60) }); }
}
for (const [name, kind, E] of [["stepV255", "V", 320], ["stepH255", "H", 180], ["stepV255b", "V", 160]]) {
  const src = srcProf(M7 + name + ".rgb", kind);
  for (const offX of [0, 0.5]) {
    const dump = p7[name].dumps["ctm-off" + offX + "-video-s2.2639"];
    const meas = prof(dec(dump.rgbB64, dump.w, dump.h), kind);
    const dl = meas.length, c = Math.round(E * 815 / 360), lo = Math.max(0, c - 60), hi = Math.min(dl, c + 60);
    all.push({ tag: "ctm:" + name + " off" + offX, src, meas, dl, srcLen: src.length, s: 815 / 360, offX: kind === "V" ? offX : 0, lo, hi });
  }
}
for (const [name, kind, E, srcRgb] of [["stepV255", "V", 320, M7 + "stepV255.rgb"], ["stepH255", "H", 180, M7 + "stepH255.rgb"], ["lineV-gray", "V", 320, M2 + "lineV-gray.rgb"]]) {
  const src = srcProf(srcRgb, kind);
  for (const s of [0.6, 0.75]) { const dump = pd[name].dumps["exp-high-video-s" + s]; const meas = prof(dec(dump.rgbB64, dump.w, dump.h), kind); const dl = meas.length, c = Math.round(E * s); all.push({ tag: "down:" + name + " s" + s, src, meas, dl, srcLen: src.length, s, offX: 0, lo: Math.max(0, c - 60), hi: Math.min(dl, c + 60) }); }
}
for (const s of [0.6, 0.75]) {
  const b = dec(w2["sqw4-mid"].dumps["B-1to1"].rgbB64, w2["sqw4-mid"].dumps["B-1to1"].w, w2["sqw4-mid"].dumps["B-1to1"].h);
  const src = prof(b, "H");
  const dump = pd["sqw4-mid"].dumps["exp-high-video-s" + s];
  const meas = prof(dec(dump.rgbB64, dump.w, dump.h), "H");
  all.push({ tag: "down:sqw4-mid s" + s, src, meas, dl: meas.length, srcLen: src.length, s, offX: 0, lo: 10, hi: meas.length - 10 });
}
// Các biến thể tính S từ (i, offX, srcLen, dstLen=srcLen*s). dstLen là độ dài đích THẬT (số pixel).
function S_of(mode, i, offX, srcLen, dstLen, sCase) {
  const x = (i + 0.5) - offX, s = sCase, dstLenEff = srcLen * sCase;
  switch (mode) {
    case "V1": return x / Math.fround(s);
    case "V4": return x / s;
    case "V6": return x * (srcLen / dstLen);
    case "V2": return x * Math.fround(1 / s);
    case "V15": return x * (1 / Math.fround(s));
    case "V16": return x * Math.fround(1 / Math.fround(s));
    case "V17": return Math.fround(x / Math.fround(s));
    case "V18": return Math.fround(x * (srcLen / dstLen));
    case "V11": return x * srcLen * Math.fround(1 / dstLenEff);
    case "V19": return x * srcLen * (1 / dstLenEff);
    case "V20": return (x * srcLen) / dstLenEff;
    case "V21": return (x / dstLenEff) * srcLen;
    case "V22": return x * Math.fround(srcLen / dstLen);
    case "V23": return Math.fround(x) / Math.fround(s);
    case "V24": return x / Math.fround(dstLen / srcLen);
  }
}
function model(src, dstLen, srcLen, s, offX, mode) {
  const o = new Float64Array(dstLen);
  for (let i = 0; i < dstLen; i++) {
    let S = S_of(mode, i, offX, srcLen, dstLen, s);
    S = Math.floor(S * 16) / 16;
    const u = S - 0.5, j0 = Math.floor(u); let a = 0;
    for (const j of [j0, j0 + 1]) { if (j < 0 || j >= src.length) continue; a += tri(j + 0.5 - S) * src[j]; }
    o[i] = Math.max(0, Math.min(255, Math.floor(a)));
  }
  return o;
}
function mad(a, b, lo, hi) { let s = 0, n = 0; for (let i = lo; i < hi; i++) { s += Math.abs(a[i] - b[i]); n++; } return s / n; }
// ---------- Mô hình V1 trên toàn bộ 87 case ----------
function modelV1(src, dstLen, srcLen, s, offX) {
  const o = new Float64Array(dstLen);
  const sf = Math.fround(s);
  for (let i = 0; i < dstLen; i++) {
    let S = ((i + 0.5) - offX) / sf;
    S = Math.floor(S * 16) / 16;
    const u = S - 0.5, j0 = Math.floor(u); let a = 0;
    for (const j of [j0, j0 + 1]) { if (j < 0 || j >= src.length) continue; a += tri(j + 0.5 - S) * src[j]; }
    o[i] = Math.max(0, Math.min(255, Math.floor(a)));
  }
  return o;
}
const report = { model: "V1: S=(i+0.5-offDst)/fround(s), S_q=floor(16S)/16, triangle, trunc", n: all.length, cases: [], integerTiePixels: null, downscaleCombos: {} };
{
  let worst = 0, nZero = 0;
  for (const c of all) {
    const m = modelV1(c.src, c.dl, c.srcLen, c.s, c.offX);
    const v = mad(m, c.meas, c.lo, c.hi);
    worst = Math.max(worst, v);
    if (v === 0) nZero++;
    report.cases.push({ tag: c.tag, mad: +v.toFixed(4) });
  }
  report.nZero = nZero; report.worst = +worst.toFixed(4);
  console.log(`V1: n=${all.length} nZero=${nZero} worst=${worst.toFixed(4)} bad:`, report.cases.filter((r) => r.mad > 0).map((r) => `${r.tag}=${r.mad}`).join(", ") || "none");
}
// ---------- Liệt kê pixel S-nguyên phân biệt được ----------
// S_exact là số nguyên (float64); so val(S) vs val(S-1/16): Chrome cho bên nào?
{
  let nDisc = 0, nFloor = 0, nDown = 0; const downList = [];
  for (const c of all) {
    for (let i = c.lo; i < c.hi; i++) {
      const S = ((i + 0.5) - c.offX) / c.s;
      if (!Number.isInteger(S)) continue;
      const vAt = (() => { const u = S - 0.5, j0 = Math.floor(u); let a = 0; for (const j of [j0, j0 + 1]) { if (j < 0 || j >= c.src.length) continue; a += tri(j + 0.5 - S) * c.src[j]; } return Math.floor(a); })();
      const vDown = (() => { const Sq = S - 1 / 16, u = Sq - 0.5, j0 = Math.floor(u); let a = 0; for (const j of [j0, j0 + 1]) { if (j < 0 || j >= c.src.length) continue; a += tri(j + 0.5 - Sq) * c.src[j]; } return Math.floor(a); })();
      if (vAt === vDown) continue;
      nDisc++;
      if (c.meas[i] === vAt) nFloor++;
      else if (c.meas[i] === vDown) { nDown++; downList.push(`${c.tag} i=${i} S=${S} meas=${c.meas[i]}`); }
      else console.log("  ?? pixel không khớp cả hai:", c.tag, "i=" + i, "meas=" + c.meas[i], "vAt=" + vAt, "vDown=" + vDown);
    }
  }
  report.integerTiePixels = { nDiscriminating: nDisc, nFloor: nFloor, nDown: nDown, downList };
  console.log(`Pixel S-nguyên phân biệt được: ${nDisc} (floor/S: ${nFloor}, S-1/16: ${nDown})`, downList.join(" | "));
}
// ---------- Downscale: 4 combo (pos floor/round x scale f32/f64) ----------
{
  const down = all.filter((c) => c.tag.startsWith("down:"));
  for (const [pm, sm] of [["floor", "f32"], ["round", "f32"], ["floor", "f64"], ["round", "f64"]]) {
    let nZero = 0, worst = 0; const bad = [];
    for (const c of down) {
      const sf = sm === "f32" ? Math.fround(c.s) : c.s;
      const m = new Float64Array(c.dl);
      for (let i = 0; i < c.dl; i++) {
        let S = (i + 0.5) / sf;
        S = pm === "floor" ? Math.floor(S * 16) / 16 : Math.round(S * 16) / 16;
        const u = S - 0.5, j0 = Math.floor(u); let a = 0;
        for (const j of [j0, j0 + 1]) { if (j < 0 || j >= c.src.length) continue; a += tri(j + 0.5 - S) * c.src[j]; }
        m[i] = Math.max(0, Math.min(255, Math.floor(a)));
      }
      const v = mad(m, c.meas, c.lo, c.hi);
      worst = Math.max(worst, v); if (v === 0) nZero++; else bad.push(c.tag + "=" + v.toFixed(3));
    }
    report.downscaleCombos[pm + "+" + sm] = { nZero, worst: +worst.toFixed(4), bad };
    console.log(`downscale pos=${pm} scale=${sm}: nZero=${nZero}/8 worst=${worst.toFixed(4)} bad: ${bad.join(", ") || "none"}`);
  }
}
writeFileEpermRetry("/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round86-n7/r86n7-verify3.json", JSON.stringify(report, null, 2));
console.log("Đã ghi r86n7-verify3.json");
