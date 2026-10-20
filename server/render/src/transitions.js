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
  // ============ R1-073 (Batch G): 15 transition mới ============
  {
    type: "smoothleft",
    xfade: "smoothleft",
    label: "Trượt mượt sang trái",
    description: "Cảnh mới trượt mượt từ phải sang, có làm mờ biên",
    category: "slide",
  },
  {
    type: "smoothright",
    xfade: "smoothright",
    label: "Trượt mượt sang phải",
    description: "Cảnh mới trượt mượt từ trái sang, có làm mờ biên",
    category: "slide",
  },
  {
    type: "smoothup",
    xfade: "smoothup",
    label: "Trượt mượt lên trên",
    description: "Cảnh mới trượt mượt từ dưới lên, có làm mờ biên",
    category: "slide",
  },
  {
    type: "smoothdown",
    xfade: "smoothdown",
    label: "Trượt mượt xuống dưới",
    description: "Cảnh mới trượt mượt từ trên xuống, có làm mờ biên",
    category: "slide",
  },
  {
    type: "slideup",
    xfade: "slideup",
    label: "Trượt lên trên",
    description: "Hai cảnh trượt dọc cùng nhau lên trên",
    category: "slide",
  },
  {
    type: "slidedown",
    xfade: "slidedown",
    label: "Trượt xuống dưới",
    description: "Hai cảnh trượt dọc cùng nhau xuống dưới",
    category: "slide",
  },
  {
    type: "circleclose",
    xfade: "circleclose",
    label: "Vòng tròn khép",
    description: "Vòng tròn khép dần từ ngoài vào, lộ cảnh mới",
    category: "fx",
  },
  {
    type: "circlecrop",
    xfade: "circlecrop",
    label: "Cắt vòng tròn",
    description: "Cảnh cũ co dần thành vòng tròn rồi biến mất",
    category: "fx",
  },
  {
    type: "rectcrop",
    xfade: "rectcrop",
    label: "Cắt chữ nhật",
    description: "Cảnh cũ co dần thành hình chữ nhật rồi biến mất",
    category: "fx",
  },
  {
    type: "pixelize",
    xfade: "pixelize",
    label: "Điểm ảnh hóa",
    description: "Cảnh cũ vỡ thành ô vuông pixel rồi chuyển sang cảnh mới",
    category: "fx",
  },
  {
    type: "hblur",
    xfade: "hblur",
    label: "Mờ ngang",
    description: "Cảnh cũ mờ nhòe theo chiều ngang rồi chuyển cảnh",
    category: "fx",
  },
  {
    type: "distance",
    xfade: "distance",
    label: "Khoảng cách",
    description: "Cảnh mới tiến lại gần từ xa như hiệu ứng zoom",
    category: "fx",
  },
  {
    type: "vertopen",
    xfade: "vertopen",
    label: "Mở dọc",
    description: "Cảnh mới mở ra từ giữa theo chiều dọc",
    category: "wipe",
  },
  {
    type: "horzopen",
    xfade: "horzopen",
    label: "Mở ngang",
    description: "Cảnh mới mở ra từ giữa theo chiều ngang",
    category: "wipe",
  },
  {
    type: "diagtl",
    xfade: "diagtl",
    label: "Chéo góc trái-trên",
    description: "Cảnh mới quét chéo từ góc trái-trên",
    category: "wipe",
  },
  // ============ TransitionHarvest (Batch H+): 30 transition xfade còn thiếu ============
  // Tất cả đã kiểm chứng bằng MP4 render thật (ffmpeg 8.1.2, testsrc2+smptebars).
  {
    type: "vertclose",
    xfade: "vertclose",
    label: "Khép dọc",
    description: "Hai nửa trên-dưới khép lại vào giữa, lộ cảnh mới",
    category: "wipe",
  },
  {
    type: "horzclose",
    xfade: "horzclose",
    label: "Khép ngang",
    description: "Hai nửa trái-phải khép lại vào giữa, lộ cảnh mới",
    category: "wipe",
  },
  {
    type: "diagtr",
    xfade: "diagtr",
    label: "Chéo góc phải-trên",
    description: "Cảnh mới quét chéo từ góc phải-trên",
    category: "wipe",
  },
  {
    type: "diagbl",
    xfade: "diagbl",
    label: "Chéo góc trái-dưới",
    description: "Cảnh mới quét chéo từ góc trái-dưới",
    category: "wipe",
  },
  {
    type: "diagbr",
    xfade: "diagbr",
    label: "Chéo góc phải-dưới",
    description: "Cảnh mới quét chéo từ góc phải-dưới",
    category: "wipe",
  },
  {
    type: "hlslice",
    xfade: "hlslice",
    label: "Cắt lát ngang trái",
    description: "Cảnh mới hiện qua các lát cắt ngang từ trái",
    category: "fx",
  },
  {
    type: "hrslice",
    xfade: "hrslice",
    label: "Cắt lát ngang phải",
    description: "Cảnh mới hiện qua các lát cắt ngang từ phải",
    category: "fx",
  },
  {
    type: "vuslice",
    xfade: "vuslice",
    label: "Cắt lát dọc lên",
    description: "Cảnh mới hiện qua các lát cắt dọc từ dưới lên",
    category: "fx",
  },
  {
    type: "vdslice",
    xfade: "vdslice",
    label: "Cắt lát dọc xuống",
    description: "Cảnh mới hiện qua các lát cắt dọc từ trên xuống",
    category: "fx",
  },
  {
    type: "fadegrays",
    xfade: "fadegrays",
    label: "Mờ qua xám",
    description: "Mờ dần qua tông xám rồi hiện cảnh mới",
    category: "fade",
  },
  {
    type: "wipetl",
    xfade: "wipetl",
    label: "Quét góc trái-trên",
    description: "Cảnh mới quét từ góc trái-trên theo đường chéo",
    category: "wipe",
  },
  {
    type: "wipetr",
    xfade: "wipetr",
    label: "Quét góc phải-trên",
    description: "Cảnh mới quét từ góc phải-trên theo đường chéo",
    category: "wipe",
  },
  {
    type: "wipebl",
    xfade: "wipebl",
    label: "Quét góc trái-dưới",
    description: "Cảnh mới quét từ góc trái-dưới theo đường chéo",
    category: "wipe",
  },
  {
    type: "wipebr",
    xfade: "wipebr",
    label: "Quét góc phải-dưới",
    description: "Cảnh mới quét từ góc phải-dưới theo đường chéo",
    category: "wipe",
  },
  {
    type: "squeezeh",
    xfade: "squeezeh",
    label: "Ép ngang",
    description: "Cảnh cũ bị ép dẹt theo chiều ngang, cảnh mới giãn ra",
    category: "fx",
  },
  {
    type: "squeezev",
    xfade: "squeezev",
    label: "Ép dọc",
    description: "Cảnh cũ bị ép dẹt theo chiều dọc, cảnh mới giãn ra",
    category: "fx",
  },
  {
    type: "zoomin",
    xfade: "zoomin",
    label: "Zoom vào",
    description: "Cảnh mới zoom phóng to dần từ giữa",
    category: "fx",
  },
  {
    type: "fadefast",
    xfade: "fadefast",
    label: "Mờ nhanh",
    description: "Hòa vào nhau với tốc độ nhanh ở đầu",
    category: "fade",
  },
  {
    type: "fadeslow",
    xfade: "fadeslow",
    label: "Mờ chậm",
    description: "Hòa vào nhau với tốc độ chậm rãi",
    category: "fade",
  },
  {
    type: "hlwind",
    xfade: "hlwind",
    label: "Gió ngang trái",
    description: "Cảnh mới thổi vào từ trái như cơn gió ngang",
    category: "slide",
  },
  {
    type: "hrwind",
    xfade: "hrwind",
    label: "Gió ngang phải",
    description: "Cảnh mới thổi vào từ phải như cơn gió ngang",
    category: "slide",
  },
  {
    type: "vuwind",
    xfade: "vuwind",
    label: "Gió dọc lên",
    description: "Cảnh mới thổi vào từ dưới lên như cơn gió",
    category: "slide",
  },
  {
    type: "vdwind",
    xfade: "vdwind",
    label: "Gió dọc xuống",
    description: "Cảnh mới thổi vào từ trên xuống như cơn gió",
    category: "slide",
  },
  {
    type: "coverleft",
    xfade: "coverleft",
    label: "Phủ sang trái",
    description: "Cảnh mới phủ lên từ phải, che dần cảnh cũ sang trái",
    category: "slide",
  },
  {
    type: "coverright",
    xfade: "coverright",
    label: "Phủ sang phải",
    description: "Cảnh mới phủ lên từ trái, che dần cảnh cũ sang phải",
    category: "slide",
  },
  {
    type: "coverup",
    xfade: "coverup",
    label: "Phủ lên trên",
    description: "Cảnh mới phủ lên từ dưới, che dần cảnh cũ lên trên",
    category: "slide",
  },
  {
    type: "coverdown",
    xfade: "coverdown",
    label: "Phủ xuống dưới",
    description: "Cảnh mới phủ lên từ trên, che dần cảnh cũ xuống dưới",
    category: "slide",
  },
  {
    type: "revealleft",
    xfade: "revealleft",
    label: "Hé lộ sang trái",
    description: "Cảnh cũ trượt sang phải, hé lộ cảnh mới bên trái",
    category: "slide",
  },
  {
    type: "revealright",
    xfade: "revealright",
    label: "Hé lộ sang phải",
    description: "Cảnh cũ trượt sang trái, hé lộ cảnh mới bên phải",
    category: "slide",
  },
  {
    type: "revealup",
    xfade: "revealup",
    label: "Hé lộ lên trên",
    description: "Cảnh cũ trượt xuống, hé lộ cảnh mới bên trên",
    category: "slide",
  },
  {
    type: "revealdown",
    xfade: "revealdown",
    label: "Hé lộ xuống dưới",
    description: "Cảnh cũ trượt lên, hé lộ cảnh mới bên dưới",
    category: "slide",
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
