#!/usr/bin/env node
/**
 * textfx.js — Text animation expressions cho render worker (Node, zero-deps).
 *
 * Mỗi animation được biên dịch thành biểu thức FFmpeg cho drawtext (x, y, alpha),
 * đánh giá theo `t` (thời gian timeline). Tương thích với cách render.js hiện tại
 * dùng drawtext cho text clips.
 *
 * Công thức chung:
 *   S  = thời điểm clip bắt đầu trên timeline (giây)
 *   p  = min(1, (t-S)/D) — tiến trình intro 0→1, D = độ dài hiệu ứng
 *   xt = (w-text_w)*x0  — vị trí x đích (x0: 0..1 từ style)
 *   yt = (h-text_h)*y0  — vị trí y đích
 *
 * Module này KHÔNG sửa render.js — nó cung cấp:
 *   - buildTextAnimExpr(anim, style, clipStart): {x, y, alpha} cho drawtext.
 *   - isTextFxAnimation(anim): animation này có được module hỗ trợ không.
 *   - TEXTFX_ANIMATIONS: danh sách animation (mirror TEXT_ANIMATIONS bên TS).
 *
 * Tích hợp vào render.js (parent agent): trong vòng lặp text clips, thay nhánh
 * `fadeUp` bằng:
 *   const te = buildTextAnimExpr(clip.style.animation ?? "none", st, S);
 *   fx = te.x; fy = te.y; extra += `:alpha='${te.alpha}'`;
 * ("typewriter" vẫn xử lý riêng bằng ASS — module này throw nếu gặp nó.)
 *
 * Chạy self-test: node src/textfx.js --self-test
 */
"use strict";

const assert = require("assert");

/** Mirror của TEXT_ANIMATIONS trong packages/video-spec/src/textfx.ts (trừ typewriter). */
const TEXTFX_ANIMATIONS = [
  "none",
  "fadeUp",
  "fadeIn",
  "slideInLeft",
  "slideInRight",
  "slideUp",
  "bounce",
  // Batch G (R1-070): entrance thêm
  "slideInDown",
  "popIn",
  // Batch G (R1-070): exit animations (cần clipEnd)
  "fadeOut",
  "fadeOutUp",
  "slideOutRight",
  "slideOutDown",
  // Batch G (R1-070): loop / emphasis / combo
  "wave",
  "blink",
  "shake",
  "fadeInOut",
];

/** Các animation cần clipEnd (exit/combo): tính hiệu ứng theo thời điểm kết thúc clip. */
const EXIT_ANIMATIONS = [
  "fadeOut",
  "fadeOutUp",
  "slideOutRight",
  "slideOutDown",
  "fadeInOut",
];

/** Format số cho filter FFmpeg: tránh ký hiệu khoa học. */
function ffNum(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

function isTextFxAnimation(anim) {
  return typeof anim === "string" && TEXTFX_ANIMATIONS.includes(anim);
}

/**
 * Dựng biểu thức drawtext cho một text animation.
 *
 * @param {string} anim  tên animation (phải thuộc TEXTFX_ANIMATIONS)
 * @param {{x?: number, y?: number}} style  style.x/style.y (0..1, mặc định 0.5)
 * @param {number} clipStart  thời điểm clip bắt đầu trên timeline (giây)
 * @param {number} [clipEnd]  thời điểm clip kết thúc (BẮT BUỘC cho exit animations)
 * @returns {{x: string, y: string, alpha: string}} biểu thức dùng trực tiếp cho drawtext
 * @throws nếu anim không được hỗ trợ (kể cả "typewriter" — dùng ASS riêng)
 */
function buildTextAnimExpr(anim, style, clipStart, clipEnd) {
  if (!isTextFxAnimation(anim)) {
    throw new Error(
      `text animation không hỗ trợ: ${JSON.stringify(anim)} ` +
      `(hỗ trợ: ${TEXTFX_ANIMATIONS.join(", ")})`
    );
  }
  if (!Number.isFinite(clipStart) || clipStart < 0) {
    throw new Error(`clipStart phải là số >= 0, nhận được: ${clipStart}`);
  }
  // Exit animations tính theo thời điểm kết thúc clip → clipEnd bắt buộc.
  if (EXIT_ANIMATIONS.includes(anim)) {
    if (!Number.isFinite(clipEnd) || clipEnd <= clipStart) {
      throw new Error(
        `animation "${anim}" cần clipEnd > clipStart, nhận được clipEnd=${clipEnd}`
      );
    }
  }
  const x0 = style && style.x !== undefined ? style.x : 0.5;
  const y0 = style && style.y !== undefined ? style.y : 0.5;
  if (!(x0 >= 0 && x0 <= 1) || !(y0 >= 0 && y0 <= 1)) {
    throw new Error(`style.x/style.y phải trong [0,1], nhận được x=${x0}, y=${y0}`);
  }

  const S = ffNum(clipStart);
  const xt = `(w-text_w)*${ffNum(x0)}`;
  const yt = `(h-text_h)*${ffNum(y0)}`;
  // p(D): tiến trình intro, clamp 0..1. Dùng trong các biểu thức dưới.
  const p = (D) => `min(1,(t-${S})/${ffNum(D)})`;
  // q(D): tiến trình outro trong D giây cuối, clamp 0..1. Chỉ dùng cho exit animations.
  const E = clipEnd !== undefined ? ffNum(clipEnd) : null;
  const q = (D) => `min(1,max(0,(t-(${E}-${ffNum(D)}))/${ffNum(D)}))`;

  switch (anim) {
    case "none":
      return { x: xt, y: yt, alpha: "1" };

    case "fadeUp": {
      // Khớp hành vi hiện tại của render.js: hiện dần + trồi lên 30px trong 0.6s.
      const k = p(0.6);
      return {
        x: xt,
        y: `${yt}-30*(1-(${k}))`,
        alpha: `(${k})`,
      };
    }

    case "fadeIn": {
      // Độ trong suốt 0 → 1 trong 0.8s, vị trí đứng yên.
      return { x: xt, y: yt, alpha: `(${p(0.8)})` };
    }

    case "slideInLeft": {
      // Trượt từ ngoài mép trái vào + mờ dần, 0.7s.
      // x đi từ -text_w (ngoài màn hình trái) tới xt.
      const q = p(0.7);
      return {
        x: `${xt}-(1-(${q}))*(${xt}+text_w)`,
        y: yt,
        alpha: `(${q})`,
      };
    }

    case "slideInRight": {
      // Trượt từ ngoài mép phải vào + mờ dần, 0.7s.
      // x đi từ w (ngoài màn hình phải) tới xt.
      const q = p(0.7);
      return {
        x: `${xt}+(1-(${q}))*(w-(${xt}))`,
        y: yt,
        alpha: `(${q})`,
      };
    }

    case "slideUp": {
      // Trượt từ dưới màn hình lên + mờ dần, 0.7s.
      // y đi từ h (dưới mép màn hình) tới yt.
      const q = p(0.7);
      return {
        x: xt,
        y: `${yt}+(1-(${q}))*(h-(${yt}))`,
        alpha: `(${q})`,
      };
    }

    case "bounce": {
      // Rơi từ trên xuống 140px, nảy nhẹ 1 nhịp rồi đứng yên. Tổng 1.0s.
      //   drop  = 140*(1-p)^2          — rơi nhanh dần đều rồi chậm lại
      //   bump  = 40*(1-p)^2*|sin(p*2π)| — 1 nhịp nảy, biên độ tắt dần
      //   y     = yt - drop + bump
      // alpha mở nhanh trong 0.3s để không bị "nhấp nháy" khi xuất hiện.
      const q = p(1.0);
      const decay = `(1-(${q}))*(1-(${q}))`;
      return {
        x: xt,
        y: `${yt}-140*${decay}+40*${decay}*abs(sin((${q})*6.283185))`,
        alpha: `(${p(0.3)})`,
      };
    }

    // ================= Batch G (R1-070): 10 animation mới =================
    // ---- Entrance thêm ----
    case "slideInDown": {
      // Trượt từ trên màn hình xuống + mờ dần, 0.7s.
      // y đi từ -text_h (ngoài mép trên) tới yt.
      const k = p(0.7);
      return {
        x: xt,
        y: `${yt}-(1-(${k}))*(${yt}+text_h)`,
        alpha: `(${k})`,
      };
    }

    case "popIn": {
      // GIẢ LẬP pop: hiện nhanh (alpha 0.25s) + nảy nhẹ theo y.
      // TRUNG THỰC: drawtext không scale được fontsize (xem TEXTFX_LIMITS.md §1)
      // nên đây KHÔNG phải scale thật — chỉ là y-bounce + fade nhanh.
      const k = p(0.5);
      const decay = `(1-(${k}))*(1-(${k}))`;
      return {
        x: xt,
        y: `${yt}-24*${decay}`,
        alpha: `(min(1,(t-${S})/0.25))`,
      };
    }

    // ---- Exit animations (tính theo clipEnd) ----
    case "fadeOut": {
      // Mờ dần trong 0.8s cuối clip.
      const k = q(0.8);
      return { x: xt, y: yt, alpha: `(1-(${k}))` };
    }

    case "fadeOutUp": {
      // Bay lên 30px + mờ dần trong 0.8s cuối (mirror của fadeUp).
      const k = q(0.8);
      return { x: xt, y: `${yt}-30*(${k})`, alpha: `(1-(${k}))` };
    }

    case "slideOutRight": {
      // Trượt ra ngoài mép phải + mờ dần trong 0.7s cuối.
      const k = q(0.7);
      return {
        x: `${xt}+(${k})*(w-(${xt}))`,
        y: yt,
        alpha: `(1-(${k}))`,
      };
    }

    case "slideOutDown": {
      // Trượt xuống dưới màn hình + mờ dần trong 0.7s cuối.
      const k = q(0.7);
      return {
        x: xt,
        y: `${yt}+(${k})*(h-(${yt}))`,
        alpha: `(1-(${k}))`,
      };
    }

    // ---- Loop / emphasis / combo ----
    case "wave": {
      // Dập dềnh lên xuống ±12px, chu kỳ 1.2s, suốt clip.
      // TRUNG THỰC: wave CẢ DÒNG chữ, không phải từng ký tự (xem TEXTFX_LIMITS.md §3).
      return {
        x: xt,
        y: `${yt}+12*sin((t-${S})*6.283185/1.2)`,
        alpha: "1",
      };
    }

    case "blink": {
      // Nhấp nháy hiện/ẩn: 0.5s hiện, 0.5s mờ (alpha 0.15), lặp suốt clip.
      return {
        x: xt,
        y: yt,
        alpha: `(if(lt(mod(t-${S},1),0.5),1,0.15))`,
      };
    }

    case "shake": {
      // Rung ngang ±10px, tắt dần trong 0.5s đầu (nhấn mạnh).
      return {
        x: `${xt}+10*sin((t-${S})*40)*max(0,1-(t-${S})/0.5)`,
        y: yt,
        alpha: "1",
      };
    }

    case "fadeInOut": {
      // Mờ vào 0.5s đầu + mờ ra 0.5s cuối.
      const pin = p(0.5);
      const pout = q(0.5);
      return { x: xt, y: yt, alpha: `(min((${pin}),(1-(${pout}))))` };
    }

    /* istanbul ignore next: đã kiểm tra isTextFxAnimation ở trên */
    default:
      throw new Error(`chưa implement: ${anim}`);
  }
}

// ---------------------------------------------------------------------------
// Self-test: node src/textfx.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. none: tĩnh, alpha 1
  let e = buildTextAnimExpr("none", { x: 0.5, y: 0.5 }, 2);
  assert.strictEqual(e.x, "(w-text_w)*0.5");
  assert.strictEqual(e.y, "(h-text_h)*0.5");
  assert.strictEqual(e.alpha, "1");

  // 2. fadeUp: khớp công thức render.js hiện tại (k = min(1,(t-S)/0.6))
  e = buildTextAnimExpr("fadeUp", { x: 0.5, y: 0.5 }, 2);
  assert.ok(e.y.includes("(t-2)/0.6"), `fadeUp y sai: ${e.y}`);
  assert.ok(e.y.includes("-30*(1-"), `fadeUp thiếu trồi 30px: ${e.y}`);
  assert.ok(e.alpha.includes("(t-2)/0.6"), `fadeUp alpha sai: ${e.alpha}`);

  // 3. fadeIn: alpha theo (t-S)/0.8, vị trí tĩnh
  e = buildTextAnimExpr("fadeIn", {}, 1.5);
  assert.ok(e.alpha.includes("(t-1.5)/0.8"), `fadeIn alpha sai: ${e.alpha}`);
  assert.strictEqual(e.x, "(w-text_w)*0.5");

  // 4. slideInLeft: x chứa text_w (điểm xuất phát ngoài mép trái)
  e = buildTextAnimExpr("slideInLeft", { x: 0.5, y: 0.3 }, 0);
  assert.ok(e.x.includes("text_w"), `slideInLeft x thiếu text_w: ${e.x}`);
  assert.ok(e.x.includes("(t-0)/0.7"), `slideInLeft thiếu tiến trình 0.7s: ${e.x}`);

  // 5. slideInRight: x chứa w (điểm xuất phát ngoài mép phải)
  e = buildTextAnimExpr("slideInRight", { x: 0.5, y: 0.3 }, 0);
  assert.ok(e.x.includes("(w-("), `slideInRight x sai: ${e.x}`);

  // 6. slideUp: y chứa h (điểm xuất phát dưới màn hình)
  e = buildTextAnimExpr("slideUp", { x: 0.2, y: 0.8 }, 3);
  assert.ok(e.y.includes("(h-("), `slideUp y sai: ${e.y}`);
  assert.ok(e.y.includes("(t-3)/0.7"), `slideUp thiếu tiến trình: ${e.y}`);

  // 7. bounce: y chứa cả drop (140) và nhịp nảy (sin), alpha mở nhanh 0.3s
  e = buildTextAnimExpr("bounce", { x: 0.5, y: 0.5 }, 2);
  assert.ok(e.y.includes("140*"), `bounce thiếu độ rơi 140px: ${e.y}`);
  assert.ok(e.y.includes("sin("), `bounce thiếu nhịp nảy: ${e.y}`);
  assert.ok(e.alpha.includes("(t-2)/0.3"), `bounce alpha sai: ${e.alpha}`);

  // 8. Từ chối animation không hỗ trợ (kể cả typewriter — dùng ASS riêng)
  assert.throws(() => buildTextAnimExpr("typewriter", {}, 0), /không hỗ trợ/);
  assert.throws(() => buildTextAnimExpr("zoomIn", {}, 0), /không hỗ trợ/);
  assert.throws(() => buildTextAnimExpr("fadeIn", {}, -1), /clipStart/);
  assert.throws(() => buildTextAnimExpr("fadeIn", { x: 2 }, 0), /\[0,1\]/);

  // 9. Mọi animation trong catalog đều build được, không throw
  for (const a of TEXTFX_ANIMATIONS) {
    const needsEnd = ["fadeOut", "fadeOutUp", "slideOutRight", "slideOutDown", "fadeInOut"].includes(a);
    const r = needsEnd
      ? buildTextAnimExpr(a, { x: 0.3, y: 0.7 }, 1.25, 5.25)
      : buildTextAnimExpr(a, { x: 0.3, y: 0.7 }, 1.25);
    assert.ok(r.x && r.y && r.alpha, `${a}: thiếu x/y/alpha`);
  }

  // 10. Batch G (R1-070): kiểm tra công thức từng animation mới
  // slideInDown: y xuất phát -text_h (ngoài mép trên)
  e = buildTextAnimExpr("slideInDown", { x: 0.5, y: 0.5 }, 2);
  assert.ok(e.y.includes("text_h"), `slideInDown y thiếu text_h: ${e.y}`);
  assert.ok(e.y.includes("(t-2)/0.7"), `slideInDown thiếu tiến trình 0.7s: ${e.y}`);

  // popIn: alpha nhanh 0.25s + nảy y (TRUNG THỰC: không scale)
  e = buildTextAnimExpr("popIn", {}, 1);
  assert.ok(e.alpha.includes("(t-1)/0.25"), `popIn alpha sai: ${e.alpha}`);
  assert.ok(e.y.includes("-24*"), `popIn thiếu nảy y: ${e.y}`);

  // fadeOut: alpha giảm trong 0.8s cuối (cần clipEnd)
  e = buildTextAnimExpr("fadeOut", {}, 2, 6);
  assert.ok(e.alpha.includes("(t-(6-0.8))/0.8"), `fadeOut alpha sai: ${e.alpha}`);
  assert.throws(() => buildTextAnimExpr("fadeOut", {}, 2), /clipEnd/);
  assert.throws(() => buildTextAnimExpr("fadeOut", {}, 2, 2), /clipEnd/);

  // fadeOutUp: y bay lên + alpha giảm
  e = buildTextAnimExpr("fadeOutUp", { x: 0.5, y: 0.5 }, 0, 4);
  assert.ok(e.y.includes("-30*"), `fadeOutUp y thiếu bay lên: ${e.y}`);
  assert.ok(e.alpha.includes("(t-(4-0.8))/0.8"), `fadeOutUp alpha sai: ${e.alpha}`);

  // slideOutRight: x tiến về w
  e = buildTextAnimExpr("slideOutRight", { x: 0.5, y: 0.5 }, 1, 5);
  assert.ok(e.x.includes("(w-("), `slideOutRight x sai: ${e.x}`);

  // slideOutDown: y tiến về h
  e = buildTextAnimExpr("slideOutDown", { x: 0.5, y: 0.5 }, 1, 5);
  assert.ok(e.y.includes("(h-("), `slideOutDown y sai: ${e.y}`);

  // wave: y dao động sin, alpha 1
  e = buildTextAnimExpr("wave", { x: 0.5, y: 0.5 }, 3);
  assert.ok(e.y.includes("sin("), `wave y thiếu sin: ${e.y}`);
  assert.ok(e.y.includes("+12*"), `wave thiếu biên độ 12px: ${e.y}`);
  assert.strictEqual(e.alpha, "1");

  // blink: alpha nhấp nháy qua if/lt/mod
  e = buildTextAnimExpr("blink", {}, 0);
  assert.ok(e.alpha.includes("mod(t-0,1)"), `blink alpha thiếu mod: ${e.alpha}`);
  assert.ok(e.alpha.includes("if("), `blink alpha thiếu if: ${e.alpha}`);

  // shake: x rung sin, tắt dần
  e = buildTextAnimExpr("shake", { x: 0.5, y: 0.5 }, 2);
  assert.ok(e.x.includes("sin((t-2)*40)"), `shake x thiếu sin: ${e.x}`);
  assert.ok(e.x.includes("max(0,1-(t-2)/0.5)"), `shake thiếu tắt dần: ${e.x}`);

  // fadeInOut: alpha = min(pin, 1-pout)
  e = buildTextAnimExpr("fadeInOut", {}, 1, 5);
  assert.ok(e.alpha.includes("(t-1)/0.5"), `fadeInOut thiếu pin: ${e.alpha}`);
  assert.ok(e.alpha.includes("(t-(5-0.5))/0.5"), `fadeInOut thiếu pout: ${e.alpha}`);

  console.log("✅ textfx.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("textfx.js — module text animation cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  TEXTFX_ANIMATIONS,
  ffNum,
  isTextFxAnimation,
  buildTextAnimExpr,
};
