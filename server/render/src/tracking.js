/**
 * tracking.js — Motion tracking overlay cho render worker (Phase 8 Q5, Node, zero-deps).
 *
 * Quỹ đạo (track.points, thời gian CỤC BỘ của clip overlay) được dịch thành
 * biểu thức x/y của filter FFmpeg `overlay`, nội suy tuyến tính giữa các
 * điểm mẫu, kẹp (clamp) ngoài khoảng [điểm đầu, điểm cuối] — cây if CÂN
 * BẰNG (đợt 88 P4; trước đây là chuỗi if lồng tuyến tính, xem buildAxisExpr).
 *
 * Biểu thức dùng biến `t` của timeline (thời gian tuyệt đối), nên thời gian
 * cục bộ là (t - S) với S = clip.start. Dạng x cuối cùng:
 *   (main_w*<Xfraction> - overlay_w/2)   — tâm sticker bám tâm vật track.
 *
 * CHÚ Ý QUOTING: biểu thức chứa dấu phẩy (hàm if) nên khi dùng trong
 * filter overlay PHẢI đặt trong dấu nháy đơn: overlay=x='...':y='...'.
 * render.js chỉ dùng dạng có quote khi clip có track; sticker thường giữ
 * dạng cũ không quote để không regression.
 */
"use strict";

const { validateTrackAttachment } = require("./tracking_validate");

function ffNum(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho biểu thức track: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

/**
 * Biểu thức nội suy 1 trục (fraction 0..1) theo thời gian cục bộ lt.
 * @param {Array<{t:number,x?:number,y?:number}>} points đã sort theo t
 * @param {"x"|"y"} axis
 * @param {string} ltExpr biểu thức thời gian cục bộ, ví dụ "(t-1.5)"
 * @returns {string} biểu thức FFmpeg trả về fraction 0..1
 *
 * Đợt 88 P4: cây if CÂN BẰNG thay cho chuỗi if lồng tuyến tính.
 * Lý do: bộ phân tích biểu thức của ffmpeg (libavutil eval) giới hạn độ sâu
 * lồng nhau (~100) — chuỗi tuyến tính có độ sâu = số điểm nên track >82
 * điểm làm geq động fail, >92 điểm làm overlay/drawtext fail (render exit 2,
 * "Missing ')' or too many args", đã đo thật bằng probe + render.js).
 * Cây cân bằng có độ sâu ≈ log2(N)+2 (240 điểm → ~10) mà GIÁ TRỊ nội suy
 * từng thời điểm giữ nguyên hệt chuỗi cũ (cùng các đoạn lerp, cùng kẹp 2
 * đầu — chỉ đổi thứ tự rẽ nhánh). Kiểm chứng bằng evaluator ở self-test
 * dưới + render thật 240 điểm (xem PHASE9_ROUND88_P4_TRACKGEQ_LIMITS.md).
 */
function buildAxisExpr(points, axis, ltExpr) {
  const pts = [...points].sort((a, b) => a.t - b.t);
  if (pts.length === 0) throw new Error("buildAxisExpr: quỹ đạo rỗng");
  if (pts.length === 1) return ffNum(pts[0][axis]);
  const T = (v) => ffNum(v);
  const seg = (a, b) => {
    const span = b.t - a.t;
    const p = span <= 0 ? "0" : `(${ltExpr}-${T(a.t)})/${T(span)}`;
    return `(${T(a[axis])}+(${T(b[axis] - a[axis])})*(${p}))`;
  };
  // Cây cân bằng trên các đoạn [lo..hi]: nút rẽ tại biên t của đoạn giữa
  // (lt(T, t_{mid+1}) → nửa trái, còn lại → nửa phải); lá = 1 đoạn lerp.
  // Tại đúng biên, nhánh phải cho p=0 → đúng giá trị điểm biên (liên tục).
  const buildTree = (lo, hi) => {
    if (lo === hi) return seg(pts[lo], pts[lo + 1]);
    const mid = (lo + hi) >> 1;
    return `if(lt(${ltExpr},${T(pts[mid + 1].t)}),${buildTree(lo, mid)},${buildTree(mid + 1, hi)})`;
  };
  const tree = buildTree(0, pts.length - 2);
  return `if(lt(${ltExpr},${T(pts[0].t)}),${T(pts[0][axis])},` +
    `if(gt(${ltExpr},${T(pts[pts.length - 1].t)}),${T(pts[pts.length - 1][axis])},${tree}))`;
}

/**
 * Dựng cặp biểu thức overlay x/y (pixel) cho sticker có track.
 * @param {object} track TrackAttachment (đã validate)
 * @param {number} start clip.start (giây, timeline)
 * @returns {{x: string, y: string}} biểu thức pixel, dùng kèm quote đơn.
 */
function buildTrackOverlayExprs(track, start) {
  const errs = validateTrackAttachment(track);
  if (errs.length > 0) throw new Error(`track không hợp lệ: ${errs.join("; ")}`);
  if (!Number.isFinite(start) || start < 0) throw new Error(`start phải là số >= 0, nhận được: ${start}`);
  const lt = `(t-${ffNum(start)})`;
  const xFrac = buildAxisExpr(track.points, "x", lt);
  const yFrac = buildAxisExpr(track.points, "y", lt);
  return {
    x: `(main_w*(${xFrac})-overlay_w/2)`,
    y: `(main_h*(${yFrac})-overlay_h/2)`,
  };
}

module.exports = { buildAxisExpr, buildTrackOverlayExprs };

// ---------------------------------------------------------------------------
// Self-test: node src/tracking.js --self-test
// ---------------------------------------------------------------------------
if (require.main === module && process.argv.includes("--self-test")) {
  const assert = require("node:assert");
  const pts = [
    { t: 0, x: 0.2, y: 0.5 },
    { t: 2, x: 0.8, y: 0.5 },
  ];
  const e = buildTrackOverlayExprs({ points: pts }, 1);
  assert.ok(e.x.includes("main_w"), "x phải có main_w");
  assert.ok(e.x.includes("if(lt((t-1)"), "x phải nội suy theo (t - start)");
  assert.ok(e.x.includes("0.2") && e.x.includes("0.6"), "x phải chứa 0.2 và delta 0.6");
  // 1 điểm → hằng số, không có if
  const e1 = buildTrackOverlayExprs({ points: [{ t: 0, x: 0.3, y: 0.7 }] }, 0);
  assert.ok(!e1.x.includes("if("), "1 điểm thì x là hằng số");
  assert.ok(e1.x.includes("0.3"), "1 điểm thì x = 0.3");
  // Validate lỗi
  assert.throws(() => buildTrackOverlayExprs({ points: [] }, 0), /không hợp lệ/);
  assert.throws(() => buildTrackOverlayExprs({ points: [{ t: 1, x: 0.5, y: 0.5 }, { t: 0, x: 0.5, y: 0.5 }] }, 0), /tăng dần/);
  // Đợt 88 P4 — cây if cân bằng: giá trị nội suy hệt chuỗi tuyến tính cũ,
  // kể cả track 240 điểm gồ ghề + kẹp ngoài khoảng + đúng tại các biên.
  // Mini evaluator cho if/lt/gt (cùng mẫu test_d3_trackfollow.js).
  const tokenize = (s) => {
    const toks = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === " " || ch === "\t") { i++; continue; }
      if ("(),+-*/".includes(ch)) { toks.push(ch); i++; continue; }
      if (/[0-9.]/.test(ch)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        toks.push(parseFloat(s.slice(i, j))); i = j; continue;
      }
      if (/[a-zA-Z_]/.test(ch)) {
        let j = i;
        while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) j++;
        toks.push(s.slice(i, j)); i = j; continue;
      }
      throw new Error(`ký tự lạ: ${ch}`);
    }
    return toks;
  };
  const evalExpr = (s, vars) => {
    const toks = tokenize(s);
    let p = 0;
    const parseExpr = () => {
      let v = parseTerm();
      while (toks[p] === "+" || toks[p] === "-") {
        const op = toks[p++];
        const r = parseTerm();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    };
    const parseTerm = () => {
      let v = parseFactor();
      while (toks[p] === "*" || toks[p] === "/") {
        const op = toks[p++];
        const r = parseFactor();
        v = op === "*" ? v * r : v / r;
      }
      return v;
    };
    const parseFactor = () => {
      const tk = toks[p++];
      if (typeof tk === "number") return tk;
      if (tk === "(") { const v = parseExpr(); if (toks[p++] !== ")") throw new Error("thiếu )"); return v; }
      if (tk === "-") return -parseFactor();
      if (typeof tk === "string" && (tk === "if" || tk === "lt" || tk === "gt")) {
        if (toks[p++] !== "(") throw new Error("thiếu ( sau hàm");
        const args = [];
        if (toks[p] !== ")") {
          for (;;) { args.push(parseExpr()); if (toks[p] === ",") { p++; continue; } break; }
        }
        if (toks[p++] !== ")") throw new Error("thiếu ) sau hàm");
        if (tk === "if") return args[0] ? args[1] : args[2];
        if (tk === "lt") return args[0] < args[1] ? 1 : 0;
        return args[0] > args[1] ? 1 : 0;
      }
      if (typeof tk === "string" && tk in vars) return vars[tk];
      throw new Error(`token không hiểu: ${tk}`);
    };
    const v = parseExpr();
    if (p !== toks.length) throw new Error(`thừa token: ${toks.slice(p).join(" ")}`);
    return v;
  };
  const lerpRef = (points, axis, t) => {
    const ps = [...points].sort((a, b) => a.t - b.t);
    if (t <= ps[0].t) return ps[0][axis];
    const last = ps[ps.length - 1];
    if (t >= last.t) return last[axis];
    for (let i = 0; i < ps.length - 1; i++) {
      const a = ps[i], b = ps[i + 1];
      if (t >= a.t && t <= b.t) {
        const p = (t - a.t) / (b.t - a.t || 1);
        return a[axis] + (b[axis] - a[axis]) * p;
      }
    }
    return last[axis];
  };
  // Track gồ ghề 240 điểm (seed cố định, không random): x nhảy lên xuống.
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const jagged = Array.from({ length: 240 }, (_, i) => ({
    t: (i * 4) / 239, x: 0.2 + 0.6 * rnd(), y: 0.5,
  }));
  const ex240 = buildAxisExpr(jagged, "x", "T");
  const ey240 = buildAxisExpr(jagged, "y", "T");
  // Độ sâu lồng if tối đa (đếm '(' chưa đóng) phải nhỏ — chuỗi cũ là ~242.
  let depth = 0, maxDepth = 0;
  for (const ch of ex240) {
    if (ch === "(") { depth++; maxDepth = Math.max(maxDepth, depth); }
    else if (ch === ")") depth--;
  }
  assert.ok(maxDepth <= 30, `cây cân bằng 240 điểm: độ sâu if tối đa ${maxDepth} (phải ≤30, chuỗi cũ ~242)`);
  for (const t of [-1, 0, 0.5, 1.234, 2, 2.5, 3.999, 4, 5]) {
    const gx = evalExpr(ex240, { T: t });
    const gy = evalExpr(ey240, { T: t });
    // Dung sai 1e-4 (không phải 1e-6): ffNum làm tròn mọi hằng số về 6 chữ
    // số thập phân nên nội suy lệch ~1e-5 với đoạn ngắn 0.0167s — sai số
    // làm tròn có sẵn từ chuỗi cũ, không phải do cây cân bằng (0.1px @1280).
    assert.ok(Math.abs(gx - lerpRef(jagged, "x", t)) < 1e-4,
      `cây cân bằng x tại T=${t}: ${gx} vs nội suy ${lerpRef(jagged, "x", t)}`);
    assert.ok(Math.abs(gy - 0.5) < 1e-9, `cây cân bằng y hằng 0.5 tại T=${t}: ${gy}`);
  }
  // Track 2 điểm vẫn cho cùng dạng cũ (1 đoạn lerp + kẹp 2 đầu).
  const e2 = buildAxisExpr([{ t: 0, x: 0.2, y: 0.5 }, { t: 4, x: 0.8, y: 0.5 }], "x", "T");
  assert.ok(Math.abs(evalExpr(e2, { T: 2 }) - 0.5) < 1e-9, "2 điểm: T=2 → 0.5");
  assert.ok(Math.abs(evalExpr(e2, { T: -1 }) - 0.2) < 1e-9, "2 điểm: kẹp trái → 0.2");
  assert.ok(Math.abs(evalExpr(e2, { T: 9 }) - 0.8) < 1e-9, "2 điểm: kẹp phải → 0.8");
  console.log("tracking.js — self-test pass");
}
