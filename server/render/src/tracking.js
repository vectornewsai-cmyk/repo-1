/**
 * tracking.js — Motion tracking overlay cho render worker (Phase 8 Q5, Node, zero-deps).
 *
 * Quỹ đạo (track.points, thời gian CỤC BỘ của clip overlay) được dịch thành
 * biểu thức x/y của filter FFmpeg `overlay`, nội suy tuyến tính giữa các
 * điểm mẫu, kẹp (clamp) ngoài khoảng [điểm đầu, điểm cuối] — cùng pattern
 * if-lồng-nhau như buildVolumeInterpExpr của audiomix.js.
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
  let expr = T(pts[pts.length - 1][axis]);
  for (let i = pts.length - 2; i >= 0; i--) {
    expr = `if(lt(${ltExpr},${T(pts[i + 1].t)}),${seg(pts[i], pts[i + 1])},${expr})`;
  }
  expr =
    `if(lt(${ltExpr},${T(pts[0].t)}),${T(pts[0][axis])},` +
    `if(gt(${ltExpr},${T(pts[pts.length - 1].t)}),${T(pts[pts.length - 1][axis])},${expr}))`;
  return expr;
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
  console.log("tracking.js — self-test pass");
}
