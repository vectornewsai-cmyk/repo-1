#!/usr/bin/env node
/**
 * lut.js — Bộ lọc màu LUT cho render worker (Node, zero-deps).
 *
 * Mirror của `packages/video-spec/src/lut.ts` — DANH SÁCH LUT PHẢI GIỐNG HỆT.
 *
 * Dùng filter `lut3d` native của FFmpeg (không cần shader, không cần GPU):
 *   lut3d=file='/path/to/cartcut-teal-orange.cube'
 *
 * Cách dùng trong render.js (agent chính tích hợp):
 *   const { buildLutFilter } = require("./lut");
 *   // trong chain video, sau format=yuv420p:
 *   const lutChain = clip.filter?.lut ? `,${buildLutFilter(clip.filter.lut, assetsDir)}` : "";
 *
 * Chạy self-test: node src/lut.js --self-test
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

/** PHẢI KHỚP với LUT_IDS trong packages/video-spec/src/lut.ts */
const LUT_IDS = [
  "cartcut-blockbuster",
  "cartcut-teal-orange",
  "cartcut-nordic-noir",
  "cartcut-honey",
  "cartcut-golden-hour",
  "cartcut-winter-blue",
  "cartcut-ocean",
  "cartcut-mono-neutral",
  "cartcut-faded-seventies",
  "cartcut-super-eight",
  "vcut-cinematic",
  "vcut-vintage-fade",
  "vcut-noir-contrast",
  "vcut-cyberpunk",
  "vcut-pastel-dream",
  "vcut-sunset-glow",
  "vcut-arctic",
  "vcut-faded-film",
  "vcut-moody-forest",
  "vcut-warm-bloom",
  "slay-amber",
  "slay-fade",
  "slay-neon",
  "slay-film",
  "slay-portrait",
  "derby-acid",
  "derby-after",
  "derby-club",
  "derby-fever",
  "derby-flash",
  "derby-hush",
  "derby-rush",
  "glassmeter-cinestill-400d",
  "glassmeter-cinestill-50d",
  "glassmeter-cinestill-800t",
  "glassmeter-fuji-acros-100-ii",
  "glassmeter-fuji-industrial-100",
  "glassmeter-fuji-pro-400h",
  "glassmeter-fuji-provia-100f",
  "glassmeter-fuji-superia-xtra-400",
  "glassmeter-fuji-velvia-100",
  "glassmeter-fuji-velvia-50",
  "glassmeter-ilford-delta-100-v2",
  "glassmeter-ilford-delta-3200-v2",
  "glassmeter-ilford-delta-400",
  "glassmeter-ilford-fp4-125-v2",
  "glassmeter-ilford-hp5-400-v2",
  "glassmeter-ilford-panf-50",
  "glassmeter-ilford-xp2-super-400",
  "glassmeter-kodak-colorplus-200",
  "glassmeter-kodak-double-x-v2",
  "glassmeter-kodak-ektachrome-e100",
  "glassmeter-kodak-ektar-100",
  "glassmeter-kodak-gold-200",
  "glassmeter-kodak-portra-160",
  "glassmeter-kodak-portra-400",
  "glassmeter-kodak-portra-800",
  "glassmeter-kodak-tmax-100-v2",
  "glassmeter-kodak-tmax-400-v2",
  "glassmeter-kodak-tmax-p3200",
  "glassmeter-kodak-trix-400-v2",
  "glassmeter-kodak-ultramax-400",
  "vcut-desert-heat",
  "vcut-emerald-city",
  "vcut-crimson-dusk",
  "vcut-steel-blue",
  "vcut-amber-noir",
  "vcut-violet-haze",
  "vcut-copper-tone",
  "vcut-midnight-teal",
  "vcut-sepia-classic",
  "vcut-kodachrome-pop",
  "vcut-polaroid-fade",
  "vcut-lomography",
  "vcut-cross-process",
  "vcut-bleach-warm",
  "vcut-retro-neon",
  "vcut-vhs-tracking",
  "vcut-bw-high-contrast",
  "vcut-bw-soft",
  "vcut-bw-selenium",
  "vcut-bw-warm",
  "vcut-bw-cold",
  "vcut-bw-infrared",
  "vcut-forest-mist",
  "vcut-ocean-deep",
  "vcut-desert-dusk",
  "vcut-autumn-glow",
  "vcut-spring-fresh",
  "vcut-winter-frost",
  "vcut-neon-nights",
  "vcut-tokyo-drift",
  "vcut-urban-decay",
  "vcut-rooftop-dawn",
  "vcut-subway-green",
  "vcut-street-sodium",
  "vcut-skin-glow",
  "vcut-soft-beauty",
  "vcut-golden-skin",
  "vcut-porcelain",
  "vcut-duotone-magenta",
  "vcut-duotone-cyan-orange",
  "vcut-infrared-false",
  "vcut-solarized",
  // --- batch K6 Phase 6 ---
  "vcut-lagoon",
  "vcut-deep-sea",
  "vcut-coral-reef",
  "vcut-santorini",
  "vcut-bali-sunset",
  "vcut-coffee-roast",
  "vcut-matcha",
  "vcut-candy-pop",
  "vcut-champagne",
  "vcut-blood-moon",
  "vcut-graveyard-fog",
  "vcut-toxic-green",
  "vcut-midnight-purple",
  "vcut-crt-green",
  "vcut-terminal-amber",
  "vcut-floppy-purple",
  "vcut-vaporwave-sunset",
  "vcut-blush-pink",
  "vcut-ivory",
  "vcut-silk-white",
  "vcut-stadium-night",
  "vcut-concert-laser",
  "vcut-vinyl-warm",
  "vcut-bw-blueprint",
  "vcut-bw-sepia-deep",
  "vcut-bw-night-green",
  "vcut-solar-flare",
  "vcut-prism",
  "vcut-acid-rain",
  "vcut-synthwave-grid",
  "vcut-monsoon-rain",
  "vcut-saigon-night",
  "vcut-hanoi-autumn",
  "vcut-lantern-fest",
  "vcut-rice-terrace",
  "vcut-midnight-market",
  "vcut-cherry-festival",
  "vcut-glacier-blue",
  "vcut-meadow-light",
  "vcut-bamboo-green",
  "vcut-lotus-pink",
  "vcut-bubble-tea",
  "vcut-honey-glow",
  "vcut-chili-ember",
  "vcut-typhoon-grey",
  "vcut-ember-night",
  "vcut-noir-smoke",
  "vcut-silk-road",
  "vcut-opal-dream",
  "vcut-coral-dawn",
  "vcut-da-lat-mist",
  "vcut-pho-hanoi",
  "vcut-sea-breeze",
  "vcut-sunset-beach",
  "vcut-forest-deep",
  "vcut-desert-sand",
  "vcut-winter-snow",
  "vcut-neon-city",
  "vcut-coffee-brown",
  "vcut-lavender-field",
  "vcut-golden-harvest",
  "vcut-midnight-blue",
  "vcut-rose-dusk",
  "vcut-mint-fresh",
  "vcut-amber-glow",
  "vcut-slate-grey",
  "vcut-peach-blush",
  "vcut-aurora",
  "vcut-iced-matcha",
  "vcut-reef-glow",
];

const LUT_META = {
  "cartcut-blockbuster": { label: "Bom tấn", description: "Tương phản cao, màu điện ảnh Hollywood" },
  "cartcut-teal-orange": { label: "Teal & Cam", description: "Da cam ấm trên nền xanh teal lạnh" },
  "cartcut-nordic-noir": { label: "Nordic Noir", description: "Lạnh, trầm, u ám kiểu phim Bắc Âu" },
  "cartcut-honey": { label: "Mật ong", description: "Ấm áp, vàng óng như nắng chiều" },
  "cartcut-golden-hour": { label: "Giờ vàng", description: "Vàng rực rỡ của hoàng hôn" },
  "cartcut-winter-blue": { label: "Xanh mùa đông", description: "Xanh băng lạnh lẽo, trong trẻo" },
  "cartcut-ocean": { label: "Đại dương", description: "Xanh biển sâu, tươi mát" },
  "cartcut-mono-neutral": { label: "Đơn sắc", description: "Đen trắng trung tính, cổ điển" },
  "cartcut-faded-seventies": { label: "Thập niên 70", description: "Màu phai mờ vintage như phim cũ" },
  "cartcut-super-eight": { label: "Super 8", description: "Màu phim nhựa 8mm hoài cổ" },
  // vcut-*: tự tạo bằng assets/filters/gen_vcut_luts.py (tác phẩm gốc)
  "vcut-cinematic": { label: "Điện ảnh", description: "Tương phản điện ảnh, highlight ấm, shadow xanh teal" },
  "vcut-vintage-fade": { label: "Phai vintage", description: "Màu phai mờ hoài cổ, đen nâng sáng" },
  "vcut-noir-contrast": { label: "Noir tương phản", description: "Đen trắng tương phản gắt, phong cách noir" },
  "vcut-cyberpunk": { label: "Cyberpunk", description: "Magenta/cyan rực rỡ, bão hòa cao kiểu neon" },
  "vcut-pastel-dream": { label: "Pastel mộng", description: "Pastel nhẹ nhàng, mềm mại như mơ" },
  "vcut-sunset-glow": { label: "Hoàng hôn rực", description: "Vàng cam rực rỡ của nắng chiều muộn" },
  "vcut-arctic": { label: "Bắc cực", description: "Xanh băng sạch, lạnh và trong" },
  "vcut-faded-film": { label: "Phim phai", description: "Tương phản thấp, phai ấm như phim cũ" },
  "vcut-moody-forest": { label: "Rừng u ám", description: "Xanh lá trầm, tối và đầy tâm trạng" },
  "vcut-warm-bloom": { label: "Ấm áp", description: "Sáng ấm áp, mềm mại, tràn đầy nắng" },
  "slay-amber": { label: "Hổ phách", description: "Tông hổ phách ấm, điện ảnh" },
  "slay-fade": { label: "Phai mờ", description: "Màu phai mờ mềm mại" },
  "slay-neon": { label: "Neon", description: "Neon rực rỡ, bão hòa cao" },
  "slay-film": { label: "Phim", description: "Màu phim điện ảnh cổ điển" },
  "slay-portrait": { label: "Chân dung", description: "Tối ưu cho da, mềm mại" },
  "derby-acid": { label: "Acid", description: "Màu acid chói, thử nghiệm" },
  "derby-after": { label: "After", description: "Tông lạnh sau cơn mưa" },
  "derby-club": { label: "Club", description: "Đèn club đêm, tương phản cao" },
  "derby-fever": { label: "Fever", description: "Sốt nóng, vàng đỏ rực" },
  "derby-flash": { label: "Flash", description: "Chớp sáng mạnh, tương phản" },
  "derby-hush": { label: "Hush", description: "Yên tĩnh, trầm lắng" },
  "derby-rush": { label: "Rush", description: "Vội vã, năng động, ấm" },
  "glassmeter-cinestill-400d": { label: "CineStill 400D", description: "Phim điện ảnh CineStill 400D" },
  "glassmeter-cinestill-50d": { label: "CineStill 50D", description: "Phim CineStill 50D ban ngày, trong trẻo" },
  "glassmeter-cinestill-800t": { label: "CineStill 800T", description: "Phim CineStill 800T tungsten, đêm neon" },
  "glassmeter-fuji-acros-100-ii": { label: "Fuji Acros 100 II", description: "Đen trắng Fuji Acros mịn" },
  "glassmeter-fuji-industrial-100": { label: "Fuji Industrial 100", description: "Phim công nghiệp Fuji, màu thực" },
  "glassmeter-fuji-pro-400h": { label: "Fuji Pro 400H", description: "Phim chân dung Fuji 400H, da đẹp" },
  "glassmeter-fuji-provia-100f": { label: "Fuji Provia 100F", description: "Slide Fuji Provia, màu chuẩn" },
  "glassmeter-fuji-superia-xtra-400": { label: "Fuji Superia 400", description: "Phim Fuji phổ thông, xanh lá đặc trưng" },
  "glassmeter-fuji-velvia-100": { label: "Fuji Velvia 100", description: "Slide Velvia bão hòa rực rỡ" },
  "glassmeter-fuji-velvia-50": { label: "Fuji Velvia 50", description: "Slide Velvia 50, phong cảnh rực rỡ" },
  "glassmeter-ilford-delta-100-v2": { label: "Ilford Delta 100", description: "Đen trắng Ilford Delta mịn" },
  "glassmeter-ilford-delta-3200-v2": { label: "Ilford Delta 3200", description: "Đen trắng ISO cao, hạt mạnh" },
  "glassmeter-ilford-delta-400": { label: "Ilford Delta 400", description: "Đen trắng đa dụng" },
  "glassmeter-ilford-fp4-125-v2": { label: "Ilford FP4 125", description: "Đen trắng cổ điển, chi tiết" },
  "glassmeter-ilford-hp5-400-v2": { label: "Ilford HP5 400", description: "Đen trắng huyền thoại" },
  "glassmeter-ilford-panf-50": { label: "Ilford PanF 50", description: "Đen trắng siêu mịn" },
  "glassmeter-ilford-xp2-super-400": { label: "Ilford XP2 400", description: "Đen trắng C41, tiện lợi" },
  "glassmeter-kodak-colorplus-200": { label: "Kodak ColorPlus 200", description: "Phim Kodak giá rẻ, ấm áp" },
  "glassmeter-kodak-double-x-v2": { label: "Kodak Double-X", description: "Phim điện ảnh đen trắng Kodak" },
  "glassmeter-kodak-ektachrome-e100": { label: "Kodak Ektachrome E100", description: "Slide Kodak, màu lạnh sạch" },
  "glassmeter-kodak-ektar-100": { label: "Kodak Ektar 100", description: "Phim Kodak bão hòa cao" },
  "glassmeter-kodak-gold-200": { label: "Kodak Gold 200", description: "Phim Kodak Gold ấm áp hoài cổ" },
  "glassmeter-kodak-portra-160": { label: "Kodak Portra 160", description: "Phim chân dung Kodak mịn" },
  "glassmeter-kodak-portra-400": { label: "Kodak Portra 400", description: "Phim chân dung Kodak huyền thoại" },
  "glassmeter-kodak-portra-800": { label: "Kodak Portra 800", description: "Phim chân dung ISO cao" },
  "glassmeter-kodak-tmax-100-v2": { label: "Kodak T-Max 100", description: "Đen trắng Kodak siêu nét" },
  "glassmeter-kodak-tmax-400-v2": { label: "Kodak T-Max 400", description: "Đen trắng Kodak đa dụng" },
  "glassmeter-kodak-tmax-p3200": { label: "Kodak T-Max P3200", description: "Đen trắng siêu nhạy sáng" },
  "glassmeter-kodak-trix-400-v2": { label: "Kodak Tri-X 400", description: "Đen trắng báo chí huyền thoại" },
  "glassmeter-kodak-ultramax-400": { label: "Kodak UltraMax 400", description: "Phim Kodak bão hòa mạnh" },
  "vcut-desert-heat": { label: "Nắng sa mạc", description: "Nóng bỏng, vàng cam sa mạc" },
  "vcut-emerald-city": { label: "Ngọc lục bảo", description: "Xanh ngọc đô thị hiện đại" },
  "vcut-crimson-dusk": { label: "Hoàng hôn đỏ", description: "Đỏ thẫm hoàng hôn" },
  "vcut-steel-blue": { label: "Xanh thép", description: "Xanh thép lạnh, công nghiệp" },
  "vcut-amber-noir": { label: "Hổ phách noir", description: "Tối u ám với highlight hổ phách" },
  "vcut-violet-haze": { label: "Tím sương", description: "Tím mờ ảo mộng mị" },
  "vcut-copper-tone": { label: "Đồng", description: "Tông đồng ấm kim loại" },
  "vcut-midnight-teal": { label: "Teal nửa đêm", description: "Teal tối, điện ảnh đêm" },
  "vcut-sepia-classic": { label: "Sepia cổ điển", description: "Nâu sepia hoài cổ" },
  "vcut-kodachrome-pop": { label: "Kodachrome", description: "Màu rực rỡ kiểu Kodachrome" },
  "vcut-polaroid-fade": { label: "Polaroid", description: "Phai mờ kiểu ảnh Polaroid" },
  "vcut-lomography": { label: "Lomo", description: "Bão hòa cao kiểu Lomography" },
  "vcut-cross-process": { label: "Cross Process", description: "Tráng chéo, màu lệch nghệ thuật" },
  "vcut-bleach-warm": { label: "Bleach ấm", description: "Bạc ấm kiểu bleach bypass" },
  "vcut-retro-neon": { label: "Retro Neon", description: "Neon hoài cổ thập niên 80" },
  "vcut-vhs-tracking": { label: "VHS", description: "Màu băng VHS cũ" },
  "vcut-bw-high-contrast": { label: "Đen trắng gắt", description: "Đen trắng tương phản cực cao" },
  "vcut-bw-soft": { label: "Đen trắng mềm", description: "Đen trắng nhẹ nhàng" },
  "vcut-bw-selenium": { label: "Đen trắng selenium", description: "Tông selenium ấm cho ảnh đen trắng" },
  "vcut-bw-warm": { label: "Đen trắng ấm", description: "Đen trắng tông ấm" },
  "vcut-bw-cold": { label: "Đen trắng lạnh", description: "Đen trắng tông lạnh" },
  "vcut-bw-infrared": { label: "Hồng ngoại", description: "Giả hồng ngoại đen trắng" },
  "vcut-forest-mist": { label: "Sương rừng", description: "Rừng mờ sương, xanh dịu" },
  "vcut-ocean-deep": { label: "Biển sâu", description: "Xanh biển sâu thẳm" },
  "vcut-desert-dusk": { label: "Sa mạc chiều", description: "Sa mạc lúc chạng vạng" },
  "vcut-autumn-glow": { label: "Thu vàng", description: "Vàng cam mùa thu rực rỡ" },
  "vcut-spring-fresh": { label: "Xuân tươi", description: "Xanh tươi mát mùa xuân" },
  "vcut-winter-frost": { label: "Băng giá", description: "Lạnh buốt mùa đông" },
  "vcut-neon-nights": { label: "Đêm neon", description: "Đèn neon đêm đô thị" },
  "vcut-tokyo-drift": { label: "Tokyo", description: "Đêm Tokyo neon xanh hồng" },
  "vcut-urban-decay": { label: "Đô thị hoang", description: "Phai úa đô thị cũ" },
  "vcut-rooftop-dawn": { label: "Bình minh", description: "Bình minh trên sân thượng" },
  "vcut-subway-green": { label: "Tàu điện", description: "Xanh lá ga tàu điện ngầm" },
  "vcut-street-sodium": { label: "Đèn đường", description: "Vàng đèn sodium đường phố" },
  "vcut-skin-glow": { label: "Da sáng", description: "Da sáng mịn, rạng rỡ" },
  "vcut-soft-beauty": { label: "Mềm mại", description: "Làm đẹp da mềm mại" },
  "vcut-golden-skin": { label: "Da vàng", description: "Da vàng óng nắng" },
  "vcut-porcelain": { label: "Sứ", description: "Da trắng sứ mịn" },
  "vcut-duotone-magenta": { label: "2 tông magenta", description: "Duotone đen-magenta nghệ thuật" },
  "vcut-duotone-cyan-orange": { label: "2 tông cyan-cam", description: "Duotone cyan-cam tương phản" },
  "vcut-infrared-false": { label: "Sai hồng ngoại", description: "Đảo kênh màu kiểu hồng ngoại giả" },
  "vcut-solarized": { label: "Solar hóa", description: "Hiệu ứng solarization đảo sáng" },
};

/** @returns {boolean} */
function isLutId(v) {
  return typeof v === "string" && LUT_IDS.includes(v);
}

// ---------------------------------------------------------------------------
// K3 (Phase 6): LUT do user tự nhập (.cube tự chế).
// Id luôn có prefix `user-`; file được upload kèm spec lúc export với tên
// dành riêng `__lut_<id>.cube` và nằm trong mediaDir của job (không nằm
// trong assets/filters/ nên không đè được LUT hệ thống).
// ---------------------------------------------------------------------------

/** @returns {boolean} id LUT user hợp lệ (slug an toàn cho tên file). */
function isUserLutId(v) {
  return (
    typeof v === "string" &&
    /^user-[a-z0-9][a-z0-9-]*$/.test(v) &&
    v.length <= 64
  );
}

/** Tên file dành riêng của LUT user trong mediaDir (khớp web + bridge). */
function userLutFileName(lutId) {
  return `__lut_${lutId}.cube`;
}

/**
 * Đường dẫn tuyệt đối tới file .cube của LUT user.
 * @throws nếu id sai định dạng, thiếu thư mục userLutsDir, hoặc file không tồn tại
 */
function userLutFilePath(lutId, userLutsDir) {
  if (!isUserLutId(lutId)) {
    throw new Error(`LUT user không hợp lệ: ${JSON.stringify(lutId)}`);
  }
  if (!userLutsDir) {
    throw new Error(
      `LUT user "${lutId}" cần thư mục user-luts (mediaDir của job) — ` +
      `file ${userLutFileName(lutId)} chưa được upload kèm spec.`
    );
  }
  const p = path.resolve(userLutsDir, userLutFileName(lutId));
  if (!fs.existsSync(p)) {
    throw new Error(
      `Không tìm thấy file LUT user: ${p} ` +
      `(export cần upload file .cube kèm theo spec)`
    );
  }
  return p;
}

/**
 * Đường dẫn tuyệt đối tới file .cube.
 * @param {string} lutId
 * @param {string} assetsDir thư mục assets/ của dự án (chứa filters/*.cube)
 * @returns {string} đường dẫn tuyệt đối
 * @throws nếu lutId không hợp lệ hoặc file không tồn tại
 */
function lutFilePath(lutId, assetsDir) {
  if (!isLutId(lutId)) {
    throw new Error(
      `LUT không hợp lệ: ${JSON.stringify(lutId)} ` +
      `(chỉ chấp nhận: ${LUT_IDS.join(", ")})`
    );
  }
  const p = path.resolve(assetsDir, "filters", `${lutId}.cube`);
  if (!fs.existsSync(p)) {
    throw new Error(
      `Không tìm thấy file LUT: ${p} ` +
      `(chạy bash assets/fetch_large_assets.sh để tải về)`
    );
  }
  return p;
}

/** Escape đường dẫn cho filter FFmpeg (giống escapeFilterPath trong render.js). */
function escapeFilterPath(p) {
  return p.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
}

/**
 * Dựng filter lut3d cho một LUT.
 * @param {string} lutId id trong catalog hoặc id LUT user (`user-...`)
 * @param {string} assetsDir thư mục assets/ của dự án
 * @param {string} [userLutsDir] thư mục chứa file .cube user (mặc định = mediaDir của job)
 * @returns {string} vd "lut3d=file='/path/to/cartcut-teal-orange.cube'"
 */
function buildLutFilter(lutId, assetsDir, userLutsDir) {
  const fp = isUserLutId(lutId)
    ? userLutFilePath(lutId, userLutsDir)
    : lutFilePath(lutId, assetsDir);
  return `lut3d=file='${escapeFilterPath(fp)}'`;
}

/**
 * Validate filter object của clip (mirror validateVideoFilter bản TS).
 * @returns {string[]} danh sách lỗi
 */
function validateVideoFilter(f) {
  if (f === undefined || f === null) return [];
  if (typeof f !== "object" || Array.isArray(f)) {
    return ["filter phải là một object"];
  }
  const errors = [];
  // LUT user chỉ kiểm tra định dạng id ở đây; file .cube tương ứng được
  // kiểm tra tồn tại lúc build filter (buildLutFilter throw nếu thiếu).
  if (f.lut !== undefined && !isLutId(f.lut) && !isUserLutId(f.lut)) {
    errors.push(
      `filter.lut không hợp lệ: ${JSON.stringify(f.lut)} ` +
      `(chỉ chấp nhận id trong catalog hoặc dạng "user-<slug>")`
    );
  }
  // R1-075: chỉnh màu thủ công
  for (const m of validateColorAdjust(f.color)) errors.push(m);
  return errors;
}

// ---------------------------------------------------------------------------
// R1-075: Chỉnh màu thủ công (mirror packages/video-spec/src/color.ts).
// PHẢI KHỚP logic với bản TS — sửa một bên thì sửa cả hai.
// ---------------------------------------------------------------------------

/** Tham số chỉnh màu theo thứ tự hiển thị UI. */
const COLOR_PARAMS = [
  "brightness",
  "contrast",
  "saturation",
  "temperature",
  "tint",
  "highlights",
  "shadows",
];

/** @returns {boolean} true nếu không chỉnh gì (render bỏ qua). */
function isColorNoop(c) {
  if (!c || typeof c !== "object") return true;
  return COLOR_PARAMS.every((k) => (c[k] ?? 0) === 0);
}

/**
 * Validate ColorAdjust (mirror validateColorAdjust bản TS).
 * @returns {string[]} danh sách lỗi
 */
function validateColorAdjust(v) {
  if (v === undefined || v === null) return [];
  if (typeof v !== "object" || Array.isArray(v)) {
    return ["filter.color phải là một object"];
  }
  const errors = [];
  const known = new Set(COLOR_PARAMS);
  for (const k of Object.keys(v)) {
    if (!known.has(k)) errors.push(`filter.color.${k} không được hỗ trợ`);
  }
  for (const k of COLOR_PARAMS) {
    const val = v[k];
    if (val === undefined) continue;
    if (typeof val !== "number" || !Number.isFinite(val)) {
      errors.push(`filter.color.${k} phải là số (nhận được: ${JSON.stringify(val)})`);
    } else if (val < -100 || val > 100) {
      errors.push(`filter.color.${k} phải trong -100..100 (nhận được: ${val})`);
    }
  }
  return errors;
}

/** Format số cho filter FFmpeg: tránh ký hiệu khoa học, tối đa 4 chữ số thập phân. */
function fmtNum(x) {
  if (Object.is(x, -0)) x = 0;
  const s = x.toFixed(4).replace(/\.?0+$/, "");
  return s === "" || s === "-" ? "0" : s;
}

/**
 * Dựng chuỗi filter FFmpeg cho chỉnh màu thủ công (mirror buildColorAdjustFilter bản TS).
 * Thứ tự: eq (brightness/contrast/saturation) → colorbalance (temperature/tint/highlights/shadows).
 * @returns {string} "" nếu không có gì để chỉnh (caller không thêm dấu phẩy).
 */
function buildColorAdjustFilter(c) {
  if (isColorNoop(c)) return "";
  const parts = [];
  const v = (k) => c[k] ?? 0;

  const eqParams = [];
  if (v("brightness") !== 0) eqParams.push(`brightness=${fmtNum(v("brightness") / 100)}`);
  if (v("contrast") !== 0) eqParams.push(`contrast=${fmtNum(1 + v("contrast") / 100)}`);
  if (v("saturation") !== 0) eqParams.push(`saturation=${fmtNum(1 + v("saturation") / 100)}`);
  if (eqParams.length > 0) parts.push(`eq=${eqParams.join(":")}`);

  const cbParams = [];
  const temp = v("temperature");
  if (temp !== 0) {
    cbParams.push(`rm=${fmtNum((temp / 100) * 0.4)}`);
    cbParams.push(`bm=${fmtNum((-temp / 100) * 0.4)}`);
  }
  const tint = v("tint");
  if (tint !== 0) {
    cbParams.push(`gm=${fmtNum((-tint / 100) * 0.4)}`);
  }
  const hi = v("highlights");
  if (hi !== 0) {
    cbParams.push(`rh=${fmtNum((hi / 100) * 0.3)}`);
    cbParams.push(`bh=${fmtNum((-hi / 100) * 0.3)}`);
  }
  const sh = v("shadows");
  if (sh !== 0) {
    cbParams.push(`rs=${fmtNum((sh / 100) * 0.3)}`);
    cbParams.push(`bs=${fmtNum((-sh / 100) * 0.3)}`);
  }
  if (cbParams.length > 0) parts.push(`colorbalance=${cbParams.join(":")}`);

  return parts.join(",");
}

// ---------------------------------------------------------------------------
// Self-test: node src/lut.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. Catalog đủ 20
  assert.strictEqual(LUT_IDS.length, 174, "catalog phải có đúng 174 LUT");
  // 2. isLutId
  assert.ok(isLutId("cartcut-teal-orange"));
  assert.ok(isLutId("cartcut-mono-neutral"));
  assert.ok(isLutId("vcut-cinematic"));
  assert.ok(isLutId("vcut-cyberpunk"));
  assert.ok(!isLutId("instagram-clarendon"));
  assert.ok(!isLutId(""));
  assert.ok(!isLutId(undefined));
  // 3. buildLutFilter sinh đúng cú pháp (dùng assetsDir thật của dự án)
  const assetsDir = path.resolve(__dirname, "..", "..", "..", "assets");
  const f = buildLutFilter("cartcut-teal-orange", assetsDir);
  assert.ok(
    f.startsWith("lut3d=file='") && f.endsWith("cartcut-teal-orange.cube'"),
    `cú pháp sai: ${f}`
  );
  // 3b. LUT vcut mới cũng build được
  const f2 = buildLutFilter("vcut-cinematic", assetsDir);
  assert.ok(f2.endsWith("vcut-cinematic.cube'"), `cú pháp sai: ${f2}`);
  // 4. Từ chối LUT không tồn tại
  assert.throws(() => buildLutFilter("khong-co", assetsDir), /không hợp lệ/);
  // 5. validateVideoFilter
  assert.deepStrictEqual(validateVideoFilter(undefined), []);
  assert.deepStrictEqual(validateVideoFilter({}), []);
  assert.deepStrictEqual(validateVideoFilter({ lut: "cartcut-ocean" }), []);
  assert.deepStrictEqual(validateVideoFilter({ color: { brightness: 20 } }), []);
  assert.ok(validateVideoFilter({ lut: "sai" }).length > 0);
  assert.ok(validateVideoFilter("chuoi").length > 0);
  // 5c. K3: LUT user — chấp nhận định dạng id, từ chối id sai format;
  // buildLutFilter throw khi thiếu file (fail fast, thông báo rõ).
  assert.deepStrictEqual(validateVideoFilter({ lut: "user-my-look" }), []);
  assert.ok(validateVideoFilter({ lut: "user-" }).length > 0);
  assert.ok(validateVideoFilter({ lut: "user-CAPS" }).length > 0);
  assert.ok(validateVideoFilter({ lut: "user-a/b" }).length > 0);
  assert.throws(() => buildLutFilter("user-my-look", assetsDir, "/tmp/khong-co"), /Không tìm thấy file LUT user/);
  assert.throws(() => buildLutFilter("user-my-look", assetsDir), /cần thư mục user-luts/);
  // 5b. validateColorAdjust
  assert.deepStrictEqual(validateColorAdjust(undefined), []);
  assert.deepStrictEqual(validateColorAdjust({}), []);
  assert.deepStrictEqual(validateColorAdjust({ brightness: -100, shadows: 100 }), []);
  assert.ok(validateColorAdjust({ brightness: 101 }).length > 0);
  assert.ok(validateColorAdjust({ contrast: "cao" }).length > 0);
  assert.ok(validateColorAdjust({ xyz: 1 }).length > 0);
  assert.ok(validateColorAdjust("chuoi").length > 0);
  assert.ok(validateVideoFilter({ color: { brightness: 999 } }).length > 0);
  // 6. Mọi LUT trong catalog đều có file .cube thật
  for (const id of LUT_IDS) {
    const fp = lutFilePath(id, assetsDir);
    assert.ok(fs.existsSync(fp), `thiếu file: ${fp}`);
  }
  // 7. buildColorAdjustFilter
  assert.strictEqual(buildColorAdjustFilter(undefined), "");
  assert.strictEqual(buildColorAdjustFilter({}), "");
  assert.strictEqual(
    buildColorAdjustFilter({ brightness: 20 }),
    "eq=brightness=0.2"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ contrast: -50, saturation: 30 }),
    "eq=contrast=0.5:saturation=1.3"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ temperature: 100 }),
    "colorbalance=rm=0.4:bm=-0.4"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ tint: -100 }),
    "colorbalance=gm=0.4"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ highlights: 100, shadows: -100 }),
    "colorbalance=rh=0.3:bh=-0.3:rs=-0.3:bs=0.3"
  );
  assert.strictEqual(
    buildColorAdjustFilter({ brightness: 10, temperature: -50 }),
    "eq=brightness=0.1,colorbalance=rm=-0.2:bm=0.2"
  );

  console.log("✅ lut.js self-test: tất cả assertion pass (174 LUT + color adjust, file .cube đầy đủ)");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("lut.js — module LUT cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  LUT_IDS,
  LUT_META,
  isLutId,
  lutFilePath,
  buildLutFilter,
  validateVideoFilter,
  // K3 (Phase 6): LUT user tự nhập
  isUserLutId,
  userLutFileName,
  userLutFilePath,
  // R1-075: chỉnh màu thủ công
  COLOR_PARAMS,
  isColorNoop,
  validateColorAdjust,
  buildColorAdjustFilter,
};
