/**
 * preview-engine.test.cjs — test previewEngine.ts (pure logic, không cần DOM).
 * Chạy sau khi tsc biên dịch sang CommonJS (xem test-preview-engine.sh).
 */
"use strict";
const assert = require("assert");

const OUT = "/tmp/vcut-test-preview-engine/out";
const pe = require(`${OUT}/apps/web/src/lib/previewEngine.js`);
// Đợt 10 (parent tích hợp): transitionClipVisual dời từ previewEngine sang
// transitionPreview.ts nên block V1 require module đã biên dịch riêng.
const tp = require(`${OUT}/apps/web/src/lib/transitionPreview.js`);
const spec = require(`${OUT}/packages/video-spec/src/index.js`);

let pass = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  pass++;
}
function eq(a, b, msg) {
  assert.strictEqual(a, b, `${msg} (nhận ${a}, muốn ${b})`);
  pass++;
}
function approx(a, b, eps, msg) {
  assert.ok(Math.abs(a - b) <= eps, `${msg} (nhận ${a}, muốn ~${b})`);
  pass++;
}

// --- 1. Thứ tự transform khớp render.js (R1-075: color adjust trước LUT) ---
eq(
  pe.PREVIEW_TRANSFORM_ORDER.join(","),
  "speed,chroma,color,lut,effects,opacity,keyframes",
  "thứ tự transform",
);

// --- 2. letterboxFit / coverFit ---
{
  const f = pe.letterboxFit(320, 240, 640, 480);
  eq(f.dw, 640, "letterbox dw");
  eq(f.dh, 480, "letterbox dh");
  eq(f.dx, 0, "letterbox dx");
  eq(f.dy, 0, "letterbox dy");
  const f2 = pe.letterboxFit(1920, 1080, 640, 480);
  eq(f2.dw, 640, "letterbox 16:9 dw");
  eq(f2.dh, 360, "letterbox 16:9 dh");
  eq(f2.dx, 0, "letterbox 16:9 dx");
  eq(f2.dy, 60, "letterbox 16:9 dy (pillarbox)");
  const c = pe.coverFit(1920, 1080, 640, 480);
  approx(c.dw, 853.33, 0.01, "cover dw");
  eq(c.dh, 480, "cover dh");
  approx(c.dx, -106.67, 0.01, "cover dx (crop giữa)");
}

// --- 3. LUT: đủ 174 id, id lạ → null ---
{
  for (const id of spec.LUT_IDS) {
    const css = pe.lutCssFilter(id);
    ok(typeof css === "string" && css.length > 0, `LUT ${id} có CSS`);
  }
  eq(spec.LUT_IDS.length, 174, "đủ 174 LUT");
  eq(pe.lutCssFilter("khong-co"), null, "LUT lạ → null");
}

// --- 3b. ColorAdjust → CSS (R1-075) ---
{
  eq(pe.colorAdjustCssFilter(undefined), "", "undefined → ''");
  eq(pe.colorAdjustCssFilter({}), "", "{} → ''");
  ok(
    pe.colorAdjustCssFilter({ brightness: 20 }).includes("brightness(1.200)"),
    "brightness=20 → brightness(1.200)"
  );
  ok(
    pe.colorAdjustCssFilter({ contrast: -50, saturation: 30 }).includes("contrast(0.500)") &&
      pe.colorAdjustCssFilter({ contrast: -50, saturation: 30 }).includes("saturate(1.300)"),
    "contrast+saturation → CSS"
  );
  ok(
    pe.colorAdjustCssFilter({ temperature: 100 }).includes("sepia("),
    "temperature → sepia xấp xỉ"
  );
  ok(
    pe.colorAdjustCssFilter({ tint: 100 }).includes("hue-rotate("),
    "tint → hue-rotate xấp xỉ"
  );
}

// --- 4. effectsVisual: công thức mirror effects.js ---
{
  const b = pe.effectsVisual([{ type: "blur", intensity: 1 }]);
  eq(b.css, "blur(8.00px)", "blur intensity=1 → sigma 8");
  const g = pe.effectsVisual([{ type: "grayscale", intensity: 1 }]);
  eq(g.css, "grayscale(1.000)", "grayscale intensity=1");
  const s = pe.effectsVisual([{ type: "sepia", intensity: 0.5 }]);
  eq(s.css, "sepia(0.500)", "sepia intensity=0.5");
  const br = pe.effectsVisual([{ type: "brightness", intensity: 0.5 }]);
  eq(br.css, "brightness(1.000)", "brightness 0.5 → giữ nguyên");
  const br2 = pe.effectsVisual([{ type: "brightness", intensity: 1 }]);
  eq(br2.css, "brightness(1.350)", "brightness 1 → +0.35");
  const v = pe.effectsVisual([{ type: "vignette", intensity: 0.7 }]);
  eq(v.vignette, 0.7, "vignette giữ intensity");
  eq(v.css, "", "vignette không vào css");
  // Đợt 10 (parent tích hợp): sharpen/noise từng bị skip, nay V2 vẽ thật
  // bằng canvas (effectCanvas.ts) nên không còn trong skipped.
  const sh = pe.effectsVisual([{ type: "sharpen", intensity: 1 }]);
  ok(!sh.skipped.includes("sharpen"), "sharpen vẽ bằng canvas, không còn skip");
  const n = pe.effectsVisual([{ type: "noise", intensity: 1 }]);
  ok(!n.skipped.includes("noise"), "noise vẽ bằng canvas (seed), không còn skip");
  const combo = pe.effectsVisual([
    { type: "grayscale", intensity: 0.5 },
    { type: "blur", intensity: 0 },
  ]);
  eq(combo.css, "grayscale(0.500) blur(0.50px)", "nhiều effect nối theo thứ tự");
}

// --- 5. videoClipVisual ---
{
  const clip = { kind: "video", id: "c", src: "a.mp4", start: 0, duration: 2, in: 0, out: 2 };
  const v0 = pe.videoClipVisual(clip, 0.5, 640, 480, 640, 480);
  eq(v0.opacity, 1, "opacity mặc định 1");
  eq(v0.offsetX, 0, "không keyframes → offset 0");
  eq(v0.cssFilter, "", "không lut/effect → css rỗng");
  eq(v0.chroma, null, "không chroma → null");

  const clip2 = {
    ...clip,
    opacity: 0.5,
    filter: { lut: "cartcut-mono-neutral" },
    effects: [{ type: "blur", intensity: 1 }],
    chromaKey: { color: "#00FF00" },
  };
  const v2 = pe.videoClipVisual(clip2, 0, 640, 480, 640, 480);
  eq(v2.opacity, 0.5, "opacity 0.5");
  // LUT trước, effects sau (đúng thứ tự render.js)
  ok(
    v2.cssFilter.indexOf("grayscale(1)") < v2.cssFilter.indexOf("blur("),
    `LUT trước effects: "${v2.cssFilter}"`,
  );
  eq(v2.chroma.similarity, 0.3, "chroma default similarity");
  eq(v2.chroma.blend, 0.1, "chroma default blend");

  // keyframes x: công thức v*(frame-unit); unit đã pad đúng WxH → 0 (quirk render)
  const clip3 = {
    ...clip,
    animations: {
      x: { keyframes: [{ t: 0, v: 0, easing: "linear" }, { t: 2, v: 1, easing: "linear" }] },
    },
  };
  const v3 = pe.videoClipVisual(clip3, 1, 640, 480, 640, 480);
  eq(v3.offsetX, 0, "unit=W → offset 0 (khớp render, xem PREVIEW_LIMITS)");
  const v3b = pe.videoClipVisual(clip3, 1, 600, 480, 1000, 480);
  eq(v3b.offsetX, 200, "công thức tổng quát: 0.5*(1000-600)");
}

// --- 6. textClipVisual: vị trí tĩnh + animations ---
{
  const base = {
    kind: "text", id: "t", start: 0, duration: 4, text: "Xin chào",
    style: { x: 0.5, y: 0.5, fontSize: 48, fontFamily: "Inter", color: "#fff", animation: "none" },
  };
  const m = { textW: 200, textH: 64.8 };
  const s0 = pe.textClipVisual(base, 1, 1280, 720, m);
  eq(s0.cx, 640, "x=0.5 → giữa màn hình");
  eq(s0.cy, 360, "y=0.5 → giữa màn hình");
  eq(s0.alpha, 1, "none → alpha 1");
  eq(s0.revealChars, null, "none → hiện hết");

  // keyframes ưu tiên hơn animation
  const kf = {
    ...base,
    style: { ...base.style, animation: "bounce" },
    animations: {
      x: { keyframes: [{ t: 0, v: 0, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] },
      opacity: { keyframes: [{ t: 0, v: 0.2, easing: "linear" }, { t: 4, v: 0.2, easing: "linear" }] },
    },
  };
  const k1 = pe.textClipVisual(kf, 2, 1280, 720, m);
  approx(k1.cx, (1280 - 200) * 0.5 + 100, 0.01, "keyframes x thắng bounce");
  approx(k1.alpha, 0.2, 1e-9, "keyframes opacity");

  // fadeUp: 0.6s, 30px (khớp render.js)
  const fu = { ...base, style: { ...base.style, animation: "fadeUp" } };
  const f1 = pe.textClipVisual(fu, 0.3, 1280, 720, m);
  approx(f1.alpha, 0.5, 1e-9, "fadeUp alpha tại 0.3s");
  approx(f1.cy, 360 - 15, 0.01, "fadeUp trồi lên 15px tại nửa đường");

  // fadeIn
  const fi = { ...base, style: { ...base.style, animation: "fadeIn" } };
  approx(pe.textClipVisual(fi, 0.4, 1280, 720, m).alpha, 0.5, 1e-9, "fadeIn 0.8s");

  // slideInLeft: tại q=1 thì x về vị trí chuẩn
  const sl = { ...base, style: { ...base.style, animation: "slideInLeft" } };
  const sl1 = pe.textClipVisual(sl, 0.7, 1280, 720, m);
  approx(sl1.cx, 640, 0.01, "slideInLeft kết thúc tại vị trí chuẩn");
  approx(sl1.alpha, 1, 1e-9, "slideInLeft alpha cuối = 1");
  const sl0 = pe.textClipVisual(sl, 0, 1280, 720, m);
  ok(sl0.cx < 0, "slideInLeft bắt đầu ngoài mép trái");

  // slideUp: bắt đầu dưới màn hình
  const su = { ...base, style: { ...base.style, animation: "slideUp" } };
  const su0 = pe.textClipVisual(su, 0, 1280, 720, m);
  ok(su0.cy > 720, "slideUp bắt đầu dưới màn hình");

  // bounce: kết thúc đứng yên
  const bo = { ...base, style: { ...base.style, animation: "bounce" } };
  const bo1 = pe.textClipVisual(bo, 1.5, 1280, 720, m);
  approx(bo1.cy, 360, 0.01, "bounce sau 1s đứng yên");
  approx(bo1.alpha, 1, 1e-9, "bounce alpha sau 0.3s = 1");

  // typewriter: hiện dần suốt duration (mirror buildTypewriterAss)
  const tw = { ...base, style: { ...base.style, animation: "typewriter" }, text: "abcd" };
  eq(pe.textClipVisual(tw, 0, 1280, 720, m).revealChars, 1, "typewriter t=0 → 1 ký tự");
  eq(pe.textClipVisual(tw, 2, 1280, 720, m).revealChars, 3, "typewriter t=2/4 → 3 ký tự");
  eq(pe.textClipVisual(tw, 3.99, 1280, 720, m).revealChars, 4, "typewriter cuối → đủ chữ");
}

// --- 7. applyChromaKey ---
{
  const mk = (pixels) => ({
    width: 2, height: 2,
    data: new Uint8ClampedArray(pixels.flatMap(([r, g, b, a]) => [r, g, b, a])),
  });
  const p = { color: "#00FF00", similarity: 0.3, blend: 0.1 };
  // inner = 0.3*0.5*441.67 ≈ 66.25; outer ≈ 88.33
  const img = mk([
    [0, 255, 0, 255],   // đúng màu key → trong suốt
    [255, 0, 0, 255],   // xa → giữ nguyên
    [0, 200, 0, 255],   // dist=55 < inner → trong suốt
    [0, 180, 0, 255],   // dist=75 trong vùng blend → alpha giữa
  ]);
  pe.applyChromaKey(img, p);
  eq(img.data[3], 0, "pixel đúng màu key → alpha 0");
  eq(img.data[7], 255, "pixel đỏ → alpha 255");
  eq(img.data[11], 0, "pixel gần key (dist<inner) → alpha 0");
  const mid = img.data[15];
  ok(mid > 0 && mid < 255, `vùng blend → alpha giữa (nhận ${mid})`);
  approx(mid, Math.round(255 * (75 - 66.25) / (88.33 - 66.25)), 3, "alpha nội suy tuyến tính");

  // màu key lạ → parse fallback xanh lá
  const img2 = mk([[0, 255, 0, 255]]);
  pe.applyChromaKey(img2, { color: "xyz", similarity: 0.3, blend: 0.1 });
  eq(img2.data[3], 0, "màu lỗi → fallback #00FF00");
}

// --- 8. stickerVisual / imageClipFit ---
{
  const st = { kind: "sticker", id: "s", src: "star.png", start: 0, duration: 3 };
  const sv = pe.stickerVisual(st, 1280, 720);
  eq(sv.cx, 640, "sticker mặc định giữa ngang");
  eq(sv.cy, 360, "sticker mặc định giữa dọc");
  eq(sv.wPx, 320, "sticker mặc định rộng 0.25*W");
  eq(sv.opacity, 1, "sticker opacity mặc định 1");
  const sv2 = pe.stickerVisual({ ...st, x: 0.2, scale: 0.5, rotation: 45 }, 1280, 720);
  eq(sv2.cx, 256, "sticker x=0.2");
  eq(sv2.wPx, 640, "sticker scale=0.5");
  eq(sv2.rotation, 45, "sticker rotation");

  const im = { kind: "image", id: "i", src: "a.png", start: 0, duration: 2 };
  const f1 = pe.imageClipFit(im, 1920, 1080, 640, 480);
  eq(f1.dh, 360, "image mặc định contain (letterbox)");
  const f2 = pe.imageClipFit({ ...im, fit: "cover" }, 1920, 1080, 640, 480);
  eq(f2.dh, 480, "image fit=cover");
}

// --- 9. parseHexColor ---
{
  eq(pe.parseHexColor("#ff0000").join(","), "255,0,0", "parse #ff0000");
  eq(pe.parseHexColor("#00FF00").join(","), "0,255,0", "parse #00FF00");
  eq(pe.parseHexColor("zzz").join(","), "0,255,0", "parse lỗi → fallback");
}

// --- 10. Keyframes scale/rotation: videoClipVisual + videoElementPlacement ---
// Mirror render.js buildKeyframeTransform: cùng interpolateKeyframes, scale
// clamp [0.01, 8], góc dương = kim đồng hồ, overlay đặt bbox theo phân số x/y.
{
  const base = { kind: "video", id: "c", src: "a.mp4", start: 0, duration: 4, in: 0, out: 4 };

  // Không keyframes SR → scale 1, rotation 0
  const v0 = pe.videoClipVisual(base, 1, 640, 360, 640, 360);
  eq(v0.scale, 1, "SR: không keyframes → scale 1");
  eq(v0.rotation, 0, "SR: không keyframes → rotation 0");

  // scale linear 1→2 tại t=2 (giữa) = 1.5; rotation 0→90 tại t=2 = 45
  const srClip = {
    ...base,
    animations: {
      scale: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] },
      rotation: { keyframes: [{ t: 0, v: 0, easing: "linear" }, { t: 4, v: 90, easing: "linear" }] },
    },
  };
  const vMid = pe.videoClipVisual(srClip, 2, 640, 360, 640, 360);
  eq(vMid.scale, 1.5, "SR: scale nội suy tuyến tính tại giữa đoạn");
  eq(vMid.rotation, 45, "SR: rotation nội suy tuyến tính tại giữa đoạn");

  // easing của keyframe BẮT ĐẦU đoạn: ease-in tại p=0.5 → hệ số 0.25
  const easeClip = {
    ...base,
    animations: {
      scale: { keyframes: [{ t: 0, v: 1, easing: "ease-in" }, { t: 4, v: 3, easing: "linear" }] },
    },
  };
  eq(pe.videoClipVisual(easeClip, 2, 640, 360, 640, 360).scale, 1.5,
    "SR: ease-in p=0.5 → 1 + 2*0.25");

  // clamp giống render: scale 20 → 8
  const bigClip = {
    ...base,
    animations: { scale: { keyframes: [{ t: 0, v: 20, easing: "linear" }] } },
  };
  eq(pe.videoClipVisual(bigClip, 0, 640, 360, 640, 360).scale, 8, "SR: scale clamp về 8");

  // placement: scale 0.5 hằng số, không xoay → bbox = nửa unit, căn giữa
  const halfClip = {
    ...base,
    animations: { scale: { keyframes: [{ t: 0, v: 0.5, easing: "linear" }] } },
  };
  const p1 = pe.videoElementPlacement(halfClip, 1, 640, 360, 640, 360);
  eq(p1.bboxW, 320, "placement: bboxW = 640*0.5");
  eq(p1.bboxH, 180, "placement: bboxH = 360*0.5");
  eq(p1.topLeftX, 160, "placement: căn giữa ngang (640-320)/2");
  eq(p1.topLeftY, 90, "placement: căn giữa dọc (360-180)/2");
  eq(p1.centerX, 320, "placement: tâm x = giữa khung");
  eq(p1.centerY, 180, "placement: tâm y = giữa khung");

  // placement: xoay 90° → bbox hoán đổi ngang/dọc
  const rotClip = {
    ...base,
    animations: { rotation: { keyframes: [{ t: 0, v: 90, easing: "linear" }] } },
  };
  const p2 = pe.videoElementPlacement(rotClip, 0, 640, 360, 640, 360);
  approx(p2.bboxW, 360, 0.01, "placement rot90: bboxW = chiều cao gốc");
  approx(p2.bboxH, 640, 0.01, "placement rot90: bboxH = chiều ngang gốc");
  eq(p2.centerX, 320, "placement rot90: tâm vẫn giữa khung");
  eq(p2.centerY, 180, "placement rot90: tâm vẫn giữa khung (dọc)");

  // placement: x keyframes có tác dụng khi element nhỏ hơn khung (khớp render A2)
  const xClip = {
    ...base,
    animations: {
      scale: { keyframes: [{ t: 0, v: 0.5, easing: "linear" }] },
      x: { keyframes: [{ t: 0, v: 0, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] },
    },
  };
  eq(pe.videoElementPlacement(xClip, 0, 640, 360, 640, 360).topLeftX, 0,
    "placement: x=0 → element sát trái");
  eq(pe.videoElementPlacement(xClip, 4, 640, 360, 640, 360).topLeftX, 320,
    "placement: x=1 → element sát phải (640-320)");
}

// --- 11. P1 (Phase 7): video opacity keyframes + text SR ---
{
  const vbase = { kind: "video", id: "c", src: "a.mp4", start: 0, duration: 4, in: 0, out: 4 };
  // tĩnh giữ nguyên
  eq(pe.videoClipVisual({ ...vbase, opacity: 0.5 }, 1, 640, 360, 640, 360).opacity, 0.5,
    "P1: opacity tĩnh 0.5 giữ nguyên");
  // keyframes 1→0: giữa đoạn = 0.5
  const okf = {
    ...vbase,
    animations: { opacity: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 0, easing: "linear" }] } },
  };
  eq(pe.videoClipVisual(okf, 2, 640, 360, 640, 360).opacity, 0.5,
    "P1: opacity keyframes 1→0 tại giữa = 0.5");
  eq(pe.videoClipVisual(okf, 4, 640, 360, 640, 360).opacity, 0,
    "P1: opacity keyframes cuối = 0");
  // keyframes THẮNG TUYỆT ĐỐI tĩnh (khớp render K1)
  const both = { ...vbase, opacity: 0.3, animations: okf.animations };
  eq(pe.videoClipVisual(both, 0, 640, 360, 640, 360).opacity, 1,
    "P1: keyframes thắng tĩnh (tĩnh 0.3, keyframes t=0 → 1)");
  // ease-in: p=0.5 → 0.25 → 1 - 0.25 = 0.75
  const ease = {
    ...vbase,
    animations: { opacity: { keyframes: [{ t: 0, v: 1, easing: "ease-in" }, { t: 4, v: 0, easing: "ease-in" }] } },
  };
  approx(pe.videoClipVisual(ease, 2, 640, 360, 640, 360).opacity, 0.75, 1e-9,
    "P1: opacity ease-in p=0.5 → 0.75");

  // --- text SR ---
  const tbase = {
    kind: "text", id: "t", start: 0, duration: 4, text: "Xin chào",
    style: { x: 0.5, y: 0.5, fontSize: 48, fontFamily: "Inter", color: "#fff", animation: "none" },
  };
  const m = { textW: 200, textH: 64.8 };
  // pad = max(4, 48/4) = 12 → PNG 224 x 88.8
  const sr = {
    ...tbase,
    animations: {
      scale: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] },
      rotation: { keyframes: [{ t: 0, v: 0, easing: "linear" }, { t: 4, v: 90, easing: "linear" }] },
    },
  };
  const s0 = pe.textClipVisual(sr, 0, 1280, 720, m);
  eq(s0.sr, true, "P1: text SR flag true");
  eq(s0.scale, 1, "P1: text SR scale t=0");
  eq(s0.rotationDeg, 0, "P1: text SR rotation t=0");
  approx(s0.cx, 640, 0.01, "P1: text SR căn giữa ngang khi không có x keyframes");
  approx(s0.cy, 360, 0.01, "P1: text SR căn giữa dọc khi không có y keyframes");
  approx(s0.bboxW, 224, 0.01, "P1: text SR bboxW t=0 (PNG 224)");
  approx(s0.bboxH, 88.8, 0.01, "P1: text SR bboxH t=0 (PNG 88.8)");
  const s4 = pe.textClipVisual(sr, 4, 1280, 720, m);
  eq(s4.scale, 2, "P1: text SR scale t=4");
  eq(s4.rotationDeg, 90, "P1: text SR rotation t=4");
  // scale 2 → 448 x 177.6, xoay 90° → bbox hoán đổi
  approx(s4.bboxW, 177.6, 0.01, "P1: text SR bboxW sau xoay 90°");
  approx(s4.bboxH, 448, 0.01, "P1: text SR bboxH sau xoay 90°");
  approx(s4.cx, 640, 0.01, "P1: text SR tâm vẫn giữa sau xoay");
  // textSrPlacement trực tiếp: x keyframes có tác dụng khi element nhỏ hơn khung
  // (clip này KHÔNG xoay — xoay 90° sẽ hoán đổi bbox, xem case trên)
  const plClip = {
    ...tbase,
    animations: {
      scale: { keyframes: [{ t: 0, v: 0.5, easing: "linear" }] },
      x: { keyframes: [{ t: 0, v: 0, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] },
    },
  };
  const pl = pe.textSrPlacement(plClip, 4, 1280, 720, m);
  approx(pl.bboxW, 112, 0.01, "P1: textSrPlacement bboxW scale 0.5");
  approx(pl.topLeftX, 1280 - 112, 0.01, "P1: textSrPlacement x=1 → sát phải");
  // SR bỏ qua style.x/y tĩnh khi không có x/y keyframes (hành vi render)
  const srOff = { ...sr, style: { ...tbase.style, x: 0.2, y: 0.2 } };
  const sOff = pe.textClipVisual(srOff, 0, 1280, 720, m);
  approx(sOff.cx, 640, 0.01, "P1: text SR không x keyframes → căn giữa, bỏ qua style.x=0.2");
  // SR + opacity keyframes → alpha nội suy
  const srOp = {
    ...sr,
    animations: { ...sr.animations, opacity: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 0, easing: "linear" }] } },
  };
  approx(pe.textClipVisual(srOp, 2, 1280, 720, m).alpha, 0.5, 1e-9,
    "P1: text SR + opacity keyframes tại giữa = 0.5");
  // typewriter + SR → SR bị bỏ qua (render dùng ASS)
  const twSr = { ...sr, style: { ...tbase.style, animation: "typewriter" } };
  eq(pe.textClipVisual(twSr, 1, 1280, 720, m).sr, false,
    "P1: typewriter + SR → sr=false (render dùng ASS)");
  // clip thường (không SR) giữ sr=false
  eq(pe.textClipVisual(tbase, 1, 1280, 720, m).sr, false,
    "P1: text thường → sr=false");
  eq(pe.textClipVisual(tbase, 1, 1280, 720, m).scale, 1,
    "P1: text thường → scale=1");
}

// --- 12. Q1 (Phase 8): mask — cùng công thức geq render (mask.js) ---
{
  const rect = { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 };
  // Khung 640x360 → biên x 160..480, y 90..270 (như self-test của mask.js).
  eq(pe.maskAlphaAt(rect, 640, 360, 320, 180), 1, "mask rect cứng: tâm trong → 1");
  eq(pe.maskAlphaAt(rect, 640, 360, 0, 0), 0, "mask rect cứng: góc ngoài → 0");
  eq(pe.maskAlphaAt(rect, 640, 360, 160, 180), 0, "mask rect cứng: đúng biên (d=0) → ngoài (như geq if lt)");
  eq(pe.maskAlphaAt(rect, 640, 360, 161, 180), 1, "mask rect cứng: trong biên 1px → 1");
  eq(pe.maskAlphaAt(rect, 640, 360, 480, 180), 0, "mask rect cứng: biên phải → 0");
  // Feather 0.2 → band = 0.2 * min(320,180) = 36.
  const soft = { ...rect, feather: 0.2 };
  eq(pe.maskAlphaAt(soft, 640, 360, 160, 180), 0.5, "mask rect feather: đúng biên → 0.5");
  approx(pe.maskAlphaAt(soft, 640, 360, 151, 180), 0.25, 1e-9, "mask rect feather: ngoài biên 9px → 0.25");
  approx(pe.maskAlphaAt(soft, 640, 360, 169, 180), 0.75, 1e-9, "mask rect feather: trong biên 9px → 0.75");
  eq(pe.maskAlphaAt(soft, 640, 360, 142, 180), 0, "mask rect feather: ngoài biên 18px → 0");
  eq(pe.maskAlphaAt(soft, 640, 360, 178, 180), 1, "mask rect feather: trong biên 18px → 1");
  // Ellipse cứng: tâm (320,180), rx=160, ry=180.
  const el = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.5, h: 1, feather: 0 };
  eq(pe.maskAlphaAt(el, 640, 360, 320, 180), 1, "mask ellipse cứng: tâm → 1");
  eq(pe.maskAlphaAt(el, 640, 360, 320, 0), 0, "mask ellipse cứng: đúng biên dọc → 0");
  eq(pe.maskAlphaAt(el, 640, 360, 320, 10), 1, "mask ellipse cứng: trong biên dọc → 1");
  eq(pe.maskAlphaAt(el, 640, 360, 0, 180), 0, "mask ellipse cứng: ngoài ngang → 0");
  // Ellipse feather: band = 0.2 * min(320,360) = 64; đúng biên ngang → 0.5.
  const elSoft = { ...el, feather: 0.2 };
  eq(pe.maskAlphaAt(elSoft, 640, 360, 480, 180), 0.5, "mask ellipse feather: đúng biên → 0.5");
  approx(pe.maskAlphaAt(elSoft, 640, 360, 470, 180), 0.667, 0.01, "mask ellipse feather: trong biên ~10.7px → ~0.667");
  eq(pe.maskAlphaAt(elSoft, 640, 360, 320, 180), 1, "mask ellipse feather: tâm → 1");
  // Invert.
  const inv = { ...rect, invert: true };
  eq(pe.maskAlphaAt(inv, 640, 360, 320, 180), 0, "mask invert: tâm → 0");
  eq(pe.maskAlphaAt(inv, 640, 360, 0, 0), 1, "mask invert: góc → 1");
  // Mask không hợp lệ → bỏ qua (alpha 1), không làm đen canvas.
  eq(pe.maskAlphaAt({ shape: "circle", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0 }, 640, 360, 0, 0), 1, "mask shape lạ → bỏ qua");
  eq(pe.maskAlphaAt({ shape: "rect", x: 0.5, y: 0.5, w: 0, h: 0.5, feather: 0 }, 640, 360, 0, 0), 1, "mask w=0 → bỏ qua");
  // applyMask: nhân alpha (không ghi đè), alpha 0 giữ nguyên.
  const mkImg = (w, h, alpha) => ({
    width: w, height: h,
    data: new Uint8ClampedArray(w * h * 4).map((_, i) => (i % 4 === 3 ? alpha : 200)),
  });
  const m4 = mkImg(4, 4, 255);
  m4.data[0 * 4 + 3] = 0; // pixel (0,0) đã trong suốt → giữ 0
  pe.applyMask(m4, { shape: "rect", x: 0.5, y: 0.5, w: 0.5, h: 0.5, feather: 0.5 });
  // Khung 4x4: biên x 1..3, y 1..3; band = 0.5*min(2,2) = 1.
  eq(m4.data[(2 * 4 + 2) * 4 + 3], 255, "applyMask: tâm (d=-1) → alpha giữ 255");
  eq(m4.data[(1 * 4 + 2) * 4 + 3], 128, "applyMask: biên (d=0) → 255*0.5 = 128");
  eq(m4.data[(3 * 4 + 3) * 4 + 3], 128, "applyMask: góc trong (d=0) → 128");
  eq(m4.data[0 * 4 + 3], 0, "applyMask: alpha 0 giữ nguyên 0");
}

// --- 13. Q1 (Phase 8): speed ramp — tốc độ + vị trí nguồn theo ∫speed ---
{
  const lin = { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] };
  // hasSpeedRamp / rampSpeedAt
  eq(pe.hasSpeedRamp({ start: 0, in: 0 }), false, "ramp: không có curve → false");
  eq(pe.hasSpeedRamp({ start: 0, in: 0, speedKeyframes: { keyframes: [] } }), false, "ramp: keyframes rỗng → false");
  eq(pe.hasSpeedRamp({ start: 0, in: 0, speedKeyframes: lin }), true, "ramp: có curve → true");
  eq(pe.rampSpeedAt({ start: 0, in: 0, speed: 2 }, 1), 2, "ramp: không curve → speed hằng");
  eq(pe.rampSpeedAt({ start: 0, in: 0 }, 1), 1, "ramp: không curve, không speed → 1");
  eq(pe.rampSpeedAt({ start: 0, in: 0, speedKeyframes: lin }, 2), 1.5, "ramp: linear 1→2 tại giữa = 1.5");
  eq(pe.rampSpeedAt({ start: 0, in: 0, speedKeyframes: lin }, 10), 2, "ramp: ngoài khoảng → clamp biên");
  const easeIn = { keyframes: [{ t: 0, v: 1, easing: "ease-in" }, { t: 4, v: 3, easing: "linear" }] };
  eq(pe.rampSpeedAt({ start: 0, in: 0, speedKeyframes: easeIn }, 2), 1.5, "ramp: ease-in p=0.5 → 1 + 2*0.25");
  // integrateRampSpeed: linear 1→2 trên [0,4]: ∫ = t + t²/8.
  // ĐÂY là case bug thượng nguồn: sourcePosAt cũ trả 3 thay vì 2.5.
  approx(pe.integrateRampSpeed(lin, 0, 2), 2.5, 1e-9, "ramp ∫: linear đoạn con [0,2] = 2.5 (không phải 3)");
  approx(pe.integrateRampSpeed(lin, 0, 4), 6, 1e-9, "ramp ∫: linear toàn đoạn [0,4] = 6");
  approx(pe.integrateRampSpeed(lin, 1, 3), 3, 1e-9, "ramp ∫: linear đoạn con [1,3] = 3");
  // ease-in 1→3 trên [0,4]: ∫ = 4 + 8/3; đoạn con [1,3] = 2 + 8*(0.75³-0.25³)/3.
  approx(pe.integrateRampSpeed(easeIn, 0, 4), 4 + 8 / 3, 1e-9, "ramp ∫: ease-in toàn đoạn");
  approx(pe.integrateRampSpeed(easeIn, 1, 3), 2 + 8 * (0.75 ** 3 - 0.25 ** 3) / 3, 1e-9, "ramp ∫: ease-in đoạn con [1,3]");
  // ease-out 1→3 trên [0,4]: ∫ = 4 + 16/3.
  const easeOut = { keyframes: [{ t: 0, v: 1, easing: "ease-out" }, { t: 4, v: 3, easing: "linear" }] };
  approx(pe.integrateRampSpeed(easeOut, 0, 4), 4 + 16 / 3, 1e-9, "ramp ∫: ease-out toàn đoạn");
  // bezier: đối chiếu brute-force (trapezoid 2000 khoảng trên speedAt).
  const bez = { keyframes: [{ t: 0, v: 1, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] }, { t: 4, v: 2, easing: "linear" }] };
  let brute = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) {
    const x0 = (i / N) * 3;
    const x1 = ((i + 1) / N) * 3;
    brute += ((pe.rampSpeedAt({ start: 0, in: 0, speedKeyframes: bez }, x0) + pe.rampSpeedAt({ start: 0, in: 0, speedKeyframes: bez }, x1)) / 2) * (x1 - x0);
  }
  approx(pe.integrateRampSpeed(bez, 0, 3), brute, 0.01, "ramp ∫: bezier khớp brute-force");
  // rampSourceTimeAt
  approx(pe.rampSourceTimeAt({ start: 10, in: 100, speedKeyframes: lin }, 12), 102.5, 1e-9,
    "ramp target: in=100 + ∫[0,2] = 102.5");
  eq(pe.rampSourceTimeAt({ start: 10, in: 100, speed: 2 }, 11), 102,
    "ramp target: không curve → mapping hằng");
  eq(pe.rampSourceTimeAt({ start: 10, in: 100, out: 104, speed: 2, reverse: true }, 11), 102,
    "ramp target: reverse không curve → out - offset");
  eq(pe.rampSourceTimeAt({ start: 10, in: 100, out: 104, speed: 2, reverse: true, speedKeyframes: lin }, 11), 102,
    "ramp target: reverse + ramp → fallback hằng (render chặn combo này)");
  eq(pe.rampSourceTimeAt({ start: 10, in: 100, speedKeyframes: lin }, 9), 100,
    "ramp target: trước clip → in");
}

// ---- V1 (Phase 9 đợt 10): transitionClipVisual — cửa sổ transition của 1 clip ----
{
  const clip = { duration: 10, transitionIn: { type: "wipeleft", duration: 2 }, transitionOut: { type: "slideleft", duration: 2 } };
  // Ngoài cửa sổ → null, alpha 1.
  let v = tp.transitionClipVisual(clip, 5, 100, 100);
  eq(v.window, null, "transClip: giữa clip → không cửa sổ");
  eq(v.alpha, 1, "transClip: giữa clip → alpha 1");
  // Cửa sổ vào: p = localT/duration, lớp B = nửa phải ở p=0.5.
  v = tp.transitionClipVisual(clip, 1, 100, 100);
  eq(v.window, "in", "transClip: đầu clip → cửa sổ vào");
  approx(v.p, 0.5, 1e-9, "transClip: p vào = localT/duration");
  eq(v.layer.region.kind, "rect", "transClip: wipeleft lớp B là rect");
  eq(v.layer.region.x, 50, "transClip: wipeleft p=0.5 → B từ x=50");
  eq(v.layer.region.w, 50, "transClip: wipeleft p=0.5 → B rộng 50");
  // Cửa sổ ra: p = elapsed/duration; lớp A slideleft dx = -pW.
  v = tp.transitionClipVisual(clip, 9, 100, 100);
  eq(v.window, "out", "transClip: cuối clip → cửa sổ ra");
  approx(v.p, 0.5, 1e-9, "transClip: p ra = elapsed/duration");
  approx(v.layer.dx, -50, 1e-9, "transClip: slideleft ra p=0.5 → A dx=-50");
  // Fade cũ giữ nguyên: vào alpha = localT/dur, ra alpha = (dur-localT)/dur.
  const fclip = { duration: 10, transitionIn: { type: "fade", duration: 2 }, transitionOut: { type: "fade", duration: 2 } };
  approx(tp.transitionClipVisual(fclip, 1, 100, 100).alpha, 0.5, 1e-9, "transClip: fade vào alpha = localT/dur");
  approx(tp.transitionClipVisual(fclip, 9, 100, 100).alpha, 0.5, 1e-9, "transClip: fade ra alpha = (dur-localT)/dur");
  // Type "none" / duration 0 → không cửa sổ.
  eq(tp.transitionClipVisual({ duration: 10, transitionIn: { type: "none", duration: 2 } }, 1, 100, 100).window, null, "transClip: type none → không cửa sổ");
  eq(tp.transitionClipVisual({ duration: 10, transitionIn: { type: "fade", duration: 0 } }, 0, 100, 100).window, null, "transClip: duration 0 → không cửa sổ");
  // Type lạ → fallback fade, không throw, geometric false.
  const weird = tp.transitionClipVisual({ duration: 10, transitionIn: { type: "kiểu-lạ", duration: 2 } }, 1, 100, 100);
  eq(weird.geometric, false, "transClip: type lạ → không hình học");
  approx(weird.alpha, 0.5, 1e-9, "transClip: type lạ → fallback fade alpha = p");
  // Cả 2 cửa sổ cùng active (clip ngắn): alpha nhân nhau (0.75 * 0.75).
  const short = { duration: 3, transitionIn: { type: "fade", duration: 2 }, transitionOut: { type: "fade", duration: 2 } };
  approx(tp.transitionClipVisual(short, 1.5, 100, 100).alpha, 0.5625, 1e-9, "transClip: 2 cửa sổ → alpha = 0.75*0.75");
}

console.log(`\n✅ preview-engine: ${pass} assertions pass`);
