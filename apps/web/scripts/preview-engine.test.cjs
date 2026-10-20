/**
 * preview-engine.test.cjs — test previewEngine.ts (pure logic, không cần DOM).
 * Chạy sau khi tsc biên dịch sang CommonJS (xem test-preview-engine.sh).
 */
"use strict";
const assert = require("assert");

const OUT = "/tmp/vcut-test-preview-engine/out";
const pe = require(`${OUT}/apps/web/src/lib/previewEngine.js`);
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

// --- 3. LUT: đủ 104 id (20 gốc + 84 harvest/gen2), id lạ → null ---
{
  for (const id of spec.LUT_IDS) {
    const css = pe.lutCssFilter(id);
    ok(typeof css === "string" && css.length > 0, `LUT ${id} có CSS`);
  }
  eq(spec.LUT_IDS.length, 104, "đủ 104 LUT");
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
  const sh = pe.effectsVisual([{ type: "sharpen", intensity: 1 }]);
  ok(sh.skipped.includes("sharpen"), "sharpen bị skip (không có CSS tương đương)");
  const n = pe.effectsVisual([{ type: "noise", intensity: 1 }]);
  ok(n.skipped.includes("noise"), "noise bị skip");
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

console.log(`\n✅ preview-engine: ${pass} assertions pass`);
