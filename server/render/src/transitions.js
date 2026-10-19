/**
 * transitions.js — Catalog transition + builder filter xfade cho render worker.
 *
 * Mọi transition ở đây đều được triển khai bằng filter `xfade` CÓ SẴN của FFmpeg
 * (không cần shader custom, không cần OpenGL). Mỗi entry đã được kiểm chứng
 * bằng video MP4 render thật — xem TRANSITIONS_LIMITS.md.
 *
 * NGUYÊN TẮC TRUNG THỰC: chỉ liệt kê transition đã render thật thành công.
 * Transition chưa test được thì KHÔNG có mặt trong catalog này.
 *
 * Cách dùng trong render.js (agent chính tích hợp):
 *   const { buildXfadeFilter } = require("./transitions");
 *   // thay dòng xfade=transition=fade... hiện tại bằng:
 *   fc.push(`${cur.label}${seg.label}` + buildXfadeFilter(tr.type, T, cur.duration - T) + `[${x}]`);
 */
"use strict";

/** Format số cho filter FFmpeg (mirror num() trong render.js). */
function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

/**
 * Catalog đầy đủ. `xfade: null` nghĩa là "không phải hiệu ứng xfade"
 * (vd "none" — không có transition).
 *
 * @type {Array<{type:string, xfade:string|null, label:string, description:string, category:string}>}
 */
const TRANSITIONS = [
  {
    type: "none",
    xfade: null,
    label: "Không",
    description: "Cắt cứng, không hiệu ứng chuyển cảnh",
    category: "none",
  },
  {
    type: "fade",
    xfade: "fade",
    label: "Mờ dần",
    description: "Hai cảnh hòa vào nhau (crossfade cổ điển)",
    category: "fade",
  },
  {
    type: "fadeblack",
    xfade: "fadeblack",
    label: "Mờ qua đen",
    description: "Mờ dần qua màn hình đen rồi hiện cảnh mới",
    category: "fade",
  },
  {
    type: "fadewhite",
    xfade: "fadewhite",
    label: "Mờ qua trắng",
    description: "Mờ dần qua màn hình trắng rồi hiện cảnh mới",
    category: "fade",
  },
  {
    type: "wipeleft",
    xfade: "wipeleft",
    label: "Quét sang trái",
    description: "Cảnh mới quét từ phải sang, đẩy cảnh cũ sang trái",
    category: "wipe",
  },
  {
    type: "wiperight",
    xfade: "wiperight",
    label: "Quét sang phải",
    description: "Cảnh mới quét từ trái sang, đẩy cảnh cũ sang phải",
    category: "wipe",
  },
  {
    type: "wipeup",
    xfade: "wipeup",
    label: "Quét lên trên",
    description: "Cảnh mới quét từ dưới lên, đẩy cảnh cũ lên trên",
    category: "wipe",
  },
  {
    type: "wipedown",
    xfade: "wipedown",
    label: "Quét xuống dưới",
    description: "Cảnh mới quét từ trên xuống, đẩy cảnh cũ xuống dưới",
    category: "wipe",
  },
  {
    type: "slideleft",
    xfade: "slideleft",
    label: "Trượt sang trái",
    description: "Hai cảnh trượt ngang cùng nhau sang trái",
    category: "slide",
  },
  {
    type: "slideright",
    xfade: "slideright",
    label: "Trượt sang phải",
    description: "Hai cảnh trượt ngang cùng nhau sang phải",
    category: "slide",
  },
  {
    type: "dissolve",
    xfade: "dissolve",
    label: "Hòa tan",
    description: "Cảnh cũ tan thành hạt li ti, cảnh mới hiện dần",
    category: "fx",
  },
  {
    type: "circleopen",
    xfade: "circleopen",
    label: "Vòng tròn mở",
    description: "Cảnh mới hiện ra từ một vòng tròn nở dần ở giữa",
    category: "fx",
  },
  {
    type: "radial",
    xfade: "radial",
    label: "Xoay tỏa tròn",
    description: "Cảnh mới xoay tỏa ra như cánh quạt",
    category: "fx",
  },
];

/** @type {Map<string, object>} */
const BY_TYPE = new Map(TRANSITIONS.map((t) => [t.type, t]));

/**
 * Lấy metadata của một transition theo type.
 * @param {string} type
 * @returns {object|null} entry trong catalog, hoặc null nếu không tồn tại
 */
function getTransition(type) {
  return BY_TYPE.get(type) || null;
}

/**
 * Transition này có render được thật không?
 * ("none" cũng trả về true — nghĩa là "hợp lệ, không cần render gì".)
 * @param {string} type
 * @returns {boolean}
 */
function isSupportedTransition(type) {
  return BY_TYPE.has(type);
}

/**
 * Danh sách transition dùng được trong UI (bỏ "none").
 * @returns {Array<object>}
 */
function listTransitions() {
  return TRANSITIONS.filter((t) => t.type !== "none");
}

/**
 * Dựng filter xfade cho một cặp clip.
 *
 * @param {string} type       transition type trong catalog (phải khác "none")
 * @param {number} duration   độ dài transition T (giây, > 0)
 * @param {number} offset     offset của xfade tính từ đầu input THỨ NHẤT (giây).
 *                            Theo ngữ nghĩa của render worker: offset = duration_của_clip_A - T
 *                            (T giây cuối của A crossfade với T giây đầu của B).
 * @returns {string} filter expression, vd "xfade=transition=wipeleft:duration=1:offset=3"
 * @throws {Error} nếu type không hỗ trợ hoặc duration/offset không hợp lệ
 */
function buildXfadeFilter(type, duration, offset) {
  const t = getTransition(type);
  if (!t) throw new Error(`transition không tồn tại: "${type}"`);
  if (!t.xfade)
    throw new Error(`transition "${type}" không phải hiệu ứng xfade (không cần filter)`);
  if (!(duration > 0))
    throw new Error(`duration phải > 0, nhận được: ${duration}`);
  if (!(offset >= 0))
    throw new Error(`offset phải >= 0, nhận được: ${offset}`);
  return `xfade=transition=${t.xfade}:duration=${num(duration)}:offset=${num(offset)}`;
}

module.exports = {
  TRANSITIONS,
  getTransition,
  isSupportedTransition,
  listTransitions,
  buildXfadeFilter,
};
