/**
 * lut.ts — Định nghĩa bộ lọc màu LUT cho video-spec.
 *
 * NGUYÊN TẮC (giống index.ts): chỉ đưa vào spec những gì render được THẬT.
 * Mỗi LUT trong catalog tương ứng 1 file .cube trong assets/filters/
 * (nguồn: cartcut, MIT — xem assets/SOURCES.md) và đã được kiểm chứng
 * bằng MP4 render thật qua filter `lut3d` của FFmpeg.
 *
 * ⚠️ MIRROR: server/render/src/lut.js có bản mirror bằng JS thuần —
 * thêm LUT mới ở đây thì PHẢI cập nhật cả lut.js.
 */

import { validateColorAdjust, type ColorAdjust } from "./color.js";

/** 104 LUT có sẵn (id = tên file .cube không đuôi).
 *  - "cartcut-*": từ dự án cartcut (MIT) — xem assets/SOURCES.md
 *  - "vcut-*": tự tạo bằng script assets/filters/gen_vcut_luts.py (tác phẩm gốc) */
export const LUT_IDS = [
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
  // --- batch K6 Phase 6 (gen_vcut_luts3.py, original) ---
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
] as const;

export type LutId = (typeof LUT_IDS)[number];

/**
 * K3 (Phase 6): Id LUT do user tự nhập (.cube tự chế).
 * - Luôn có prefix `user-` nên không đè được LUT hệ thống.
 * - File .cube không nằm trong assets/filters/ mà được upload kèm spec lúc
 *   export với tên dành riêng `__lut_<id>.cube` (xem userLutFileName).
 * - Render worker resolve từ mediaDir của job (server/render/src/lut.js).
 */
export type UserLutId = `user-${string}`;

/** Kiểm tra một giá trị có phải id LUT user hợp lệ không (slug an toàn cho tên file). */
export function isUserLutId(v: unknown): v is UserLutId {
  return (
    typeof v === "string" &&
    /^user-[a-z0-9][a-z0-9-]*$/.test(v) &&
    v.length <= 64
  );
}

/** Tên file dành riêng khi upload LUT user lên bridge (khớp render worker). */
export function userLutFileName(id: UserLutId): string {
  return `__lut_${id}.cube`;
}

/** Metadata hiển thị cho UI (tiếng Việt). */
export const LUT_META: Record<LutId, { label: string; description: string }> = {
  "cartcut-blockbuster": {
    label: "Bom tấn",
    description: "Tương phản cao, màu điện ảnh Hollywood",
  },
  "cartcut-teal-orange": {
    label: "Teal & Cam",
    description: "Da cam ấm trên nền xanh teal lạnh — phong cách phim hành động",
  },
  "cartcut-nordic-noir": {
    label: "Nordic Noir",
    description: "Lạnh, trầm, u ám kiểu phim trinh thám Bắc Âu",
  },
  "cartcut-honey": {
    label: "Mật ong",
    description: "Ấm áp, vàng óng như nắng chiều",
  },
  "cartcut-golden-hour": {
    label: "Giờ vàng",
    description: "Vàng rực rỡ của khoảnh khắc hoàng hôn",
  },
  "cartcut-winter-blue": {
    label: "Xanh mùa đông",
    description: "Xanh băng lạnh lẽo, trong trẻo",
  },
  "cartcut-ocean": {
    label: "Đại dương",
    description: "Xanh biển sâu, tươi mát",
  },
  "cartcut-mono-neutral": {
    label: "Đơn sắc",
    description: "Đen trắng trung tính, cổ điển",
  },
  "cartcut-faded-seventies": {
    label: "Thập niên 70",
    description: "Màu phai mờ vintage như phim cũ",
  },
  "cartcut-super-eight": {
    label: "Super 8",
    description: "Màu phim nhựa 8mm hoài cổ",
  },
  // --- vcut-*: tự tạo (tác phẩm gốc của VCut Studio) ---
  "vcut-cinematic": {
    label: "Điện ảnh",
    description: "Tương phản điện ảnh, highlight ấm, shadow xanh teal",
  },
  "vcut-vintage-fade": {
    label: "Phai vintage",
    description: "Màu phai mờ hoài cổ, đen nâng sáng",
  },
  "vcut-noir-contrast": {
    label: "Noir tương phản",
    description: "Đen trắng tương phản gắt, phong cách noir",
  },
  "vcut-cyberpunk": {
    label: "Cyberpunk",
    description: "Magenta/cyan rực rỡ, bão hòa cao kiểu neon",
  },
  "vcut-pastel-dream": {
    label: "Pastel mộng",
    description: "Pastel nhẹ nhàng, mềm mại như mơ",
  },
  "vcut-sunset-glow": {
    label: "Hoàng hôn rực",
    description: "Vàng cam rực rỡ của nắng chiều muộn",
  },
  "vcut-arctic": {
    label: "Bắc cực",
    description: "Xanh băng sạch, lạnh và trong",
  },
  "vcut-faded-film": {
    label: "Phim phai",
    description: "Tương phản thấp, phai ấm như phim cũ",
  },
  "vcut-moody-forest": {
    label: "Rừng u ám",
    description: "Xanh lá trầm, tối và đầy tâm trạng",
  },
  "vcut-warm-bloom": {
    label: "Ấm áp",
    description: "Sáng ấm áp, mềm mại, tràn đầy nắng",
  },
  "slay-amber": {
    label: "Hổ phách",
    description: "Tông hổ phách ấm, điện ảnh",
  },
  "slay-fade": {
    label: "Phai mờ",
    description: "Màu phai mờ mềm mại",
  },
  "slay-neon": {
    label: "Neon",
    description: "Neon rực rỡ, bão hòa cao",
  },
  "slay-film": {
    label: "Phim",
    description: "Màu phim điện ảnh cổ điển",
  },
  "slay-portrait": {
    label: "Chân dung",
    description: "Tối ưu cho da, mềm mại",
  },
  "derby-acid": {
    label: "Acid",
    description: "Màu acid chói, thử nghiệm",
  },
  "derby-after": {
    label: "After",
    description: "Tông lạnh sau cơn mưa",
  },
  "derby-club": {
    label: "Club",
    description: "Đèn club đêm, tương phản cao",
  },
  "derby-fever": {
    label: "Fever",
    description: "Sốt nóng, vàng đỏ rực",
  },
  "derby-flash": {
    label: "Flash",
    description: "Chớp sáng mạnh, tương phản",
  },
  "derby-hush": {
    label: "Hush",
    description: "Yên tĩnh, trầm lắng",
  },
  "derby-rush": {
    label: "Rush",
    description: "Vội vã, năng động, ấm",
  },
  "glassmeter-cinestill-400d": {
    label: "CineStill 400D",
    description: "Phim điện ảnh CineStill 400D",
  },
  "glassmeter-cinestill-50d": {
    label: "CineStill 50D",
    description: "Phim CineStill 50D ban ngày, trong trẻo",
  },
  "glassmeter-cinestill-800t": {
    label: "CineStill 800T",
    description: "Phim CineStill 800T tungsten, đêm neon",
  },
  "glassmeter-fuji-acros-100-ii": {
    label: "Fuji Acros 100 II",
    description: "Đen trắng Fuji Acros mịn",
  },
  "glassmeter-fuji-industrial-100": {
    label: "Fuji Industrial 100",
    description: "Phim công nghiệp Fuji, màu thực",
  },
  "glassmeter-fuji-pro-400h": {
    label: "Fuji Pro 400H",
    description: "Phim chân dung Fuji 400H, da đẹp",
  },
  "glassmeter-fuji-provia-100f": {
    label: "Fuji Provia 100F",
    description: "Slide Fuji Provia, màu chuẩn",
  },
  "glassmeter-fuji-superia-xtra-400": {
    label: "Fuji Superia 400",
    description: "Phim Fuji phổ thông, xanh lá đặc trưng",
  },
  "glassmeter-fuji-velvia-100": {
    label: "Fuji Velvia 100",
    description: "Slide Velvia bão hòa rực rỡ",
  },
  "glassmeter-fuji-velvia-50": {
    label: "Fuji Velvia 50",
    description: "Slide Velvia 50, phong cảnh rực rỡ",
  },
  "glassmeter-ilford-delta-100-v2": {
    label: "Ilford Delta 100",
    description: "Đen trắng Ilford Delta mịn",
  },
  "glassmeter-ilford-delta-3200-v2": {
    label: "Ilford Delta 3200",
    description: "Đen trắng ISO cao, hạt mạnh",
  },
  "glassmeter-ilford-delta-400": {
    label: "Ilford Delta 400",
    description: "Đen trắng đa dụng",
  },
  "glassmeter-ilford-fp4-125-v2": {
    label: "Ilford FP4 125",
    description: "Đen trắng cổ điển, chi tiết",
  },
  "glassmeter-ilford-hp5-400-v2": {
    label: "Ilford HP5 400",
    description: "Đen trắng huyền thoại",
  },
  "glassmeter-ilford-panf-50": {
    label: "Ilford PanF 50",
    description: "Đen trắng siêu mịn",
  },
  "glassmeter-ilford-xp2-super-400": {
    label: "Ilford XP2 400",
    description: "Đen trắng C41, tiện lợi",
  },
  "glassmeter-kodak-colorplus-200": {
    label: "Kodak ColorPlus 200",
    description: "Phim Kodak giá rẻ, ấm áp",
  },
  "glassmeter-kodak-double-x-v2": {
    label: "Kodak Double-X",
    description: "Phim điện ảnh đen trắng Kodak",
  },
  "glassmeter-kodak-ektachrome-e100": {
    label: "Kodak Ektachrome E100",
    description: "Slide Kodak, màu lạnh sạch",
  },
  "glassmeter-kodak-ektar-100": {
    label: "Kodak Ektar 100",
    description: "Phim Kodak bão hòa cao",
  },
  "glassmeter-kodak-gold-200": {
    label: "Kodak Gold 200",
    description: "Phim Kodak Gold ấm áp hoài cổ",
  },
  "glassmeter-kodak-portra-160": {
    label: "Kodak Portra 160",
    description: "Phim chân dung Kodak mịn",
  },
  "glassmeter-kodak-portra-400": {
    label: "Kodak Portra 400",
    description: "Phim chân dung Kodak huyền thoại",
  },
  "glassmeter-kodak-portra-800": {
    label: "Kodak Portra 800",
    description: "Phim chân dung ISO cao",
  },
  "glassmeter-kodak-tmax-100-v2": {
    label: "Kodak T-Max 100",
    description: "Đen trắng Kodak siêu nét",
  },
  "glassmeter-kodak-tmax-400-v2": {
    label: "Kodak T-Max 400",
    description: "Đen trắng Kodak đa dụng",
  },
  "glassmeter-kodak-tmax-p3200": {
    label: "Kodak T-Max P3200",
    description: "Đen trắng siêu nhạy sáng",
  },
  "glassmeter-kodak-trix-400-v2": {
    label: "Kodak Tri-X 400",
    description: "Đen trắng báo chí huyền thoại",
  },
  "glassmeter-kodak-ultramax-400": {
    label: "Kodak UltraMax 400",
    description: "Phim Kodak bão hòa mạnh",
  },
  "vcut-desert-heat": {
    label: "Nắng sa mạc",
    description: "Nóng bỏng, vàng cam sa mạc",
  },
  "vcut-emerald-city": {
    label: "Ngọc lục bảo",
    description: "Xanh ngọc đô thị hiện đại",
  },
  "vcut-crimson-dusk": {
    label: "Hoàng hôn đỏ",
    description: "Đỏ thẫm hoàng hôn",
  },
  "vcut-steel-blue": {
    label: "Xanh thép",
    description: "Xanh thép lạnh, công nghiệp",
  },
  "vcut-amber-noir": {
    label: "Hổ phách noir",
    description: "Tối u ám với highlight hổ phách",
  },
  "vcut-violet-haze": {
    label: "Tím sương",
    description: "Tím mờ ảo mộng mị",
  },
  "vcut-copper-tone": {
    label: "Đồng",
    description: "Tông đồng ấm kim loại",
  },
  "vcut-midnight-teal": {
    label: "Teal nửa đêm",
    description: "Teal tối, điện ảnh đêm",
  },
  "vcut-sepia-classic": {
    label: "Sepia cổ điển",
    description: "Nâu sepia hoài cổ",
  },
  "vcut-kodachrome-pop": {
    label: "Kodachrome",
    description: "Màu rực rỡ kiểu Kodachrome",
  },
  "vcut-polaroid-fade": {
    label: "Polaroid",
    description: "Phai mờ kiểu ảnh Polaroid",
  },
  "vcut-lomography": {
    label: "Lomo",
    description: "Bão hòa cao kiểu Lomography",
  },
  "vcut-cross-process": {
    label: "Cross Process",
    description: "Tráng chéo, màu lệch nghệ thuật",
  },
  "vcut-bleach-warm": {
    label: "Bleach ấm",
    description: "Bạc ấm kiểu bleach bypass",
  },
  "vcut-retro-neon": {
    label: "Retro Neon",
    description: "Neon hoài cổ thập niên 80",
  },
  "vcut-vhs-tracking": {
    label: "VHS",
    description: "Màu băng VHS cũ",
  },
  "vcut-bw-high-contrast": {
    label: "Đen trắng gắt",
    description: "Đen trắng tương phản cực cao",
  },
  "vcut-bw-soft": {
    label: "Đen trắng mềm",
    description: "Đen trắng nhẹ nhàng",
  },
  "vcut-bw-selenium": {
    label: "Đen trắng selenium",
    description: "Tông selenium ấm cho ảnh đen trắng",
  },
  "vcut-bw-warm": {
    label: "Đen trắng ấm",
    description: "Đen trắng tông ấm",
  },
  "vcut-bw-cold": {
    label: "Đen trắng lạnh",
    description: "Đen trắng tông lạnh",
  },
  "vcut-bw-infrared": {
    label: "Hồng ngoại",
    description: "Giả hồng ngoại đen trắng",
  },
  "vcut-forest-mist": {
    label: "Sương rừng",
    description: "Rừng mờ sương, xanh dịu",
  },
  "vcut-ocean-deep": {
    label: "Biển sâu",
    description: "Xanh biển sâu thẳm",
  },
  "vcut-desert-dusk": {
    label: "Sa mạc chiều",
    description: "Sa mạc lúc chạng vạng",
  },
  "vcut-autumn-glow": {
    label: "Thu vàng",
    description: "Vàng cam mùa thu rực rỡ",
  },
  "vcut-spring-fresh": {
    label: "Xuân tươi",
    description: "Xanh tươi mát mùa xuân",
  },
  "vcut-winter-frost": {
    label: "Băng giá",
    description: "Lạnh buốt mùa đông",
  },
  "vcut-neon-nights": {
    label: "Đêm neon",
    description: "Đèn neon đêm đô thị",
  },
  "vcut-tokyo-drift": {
    label: "Tokyo",
    description: "Đêm Tokyo neon xanh hồng",
  },
  "vcut-urban-decay": {
    label: "Đô thị hoang",
    description: "Phai úa đô thị cũ",
  },
  "vcut-rooftop-dawn": {
    label: "Bình minh",
    description: "Bình minh trên sân thượng",
  },
  "vcut-subway-green": {
    label: "Tàu điện",
    description: "Xanh lá ga tàu điện ngầm",
  },
  "vcut-street-sodium": {
    label: "Đèn đường",
    description: "Vàng đèn sodium đường phố",
  },
  "vcut-skin-glow": {
    label: "Da sáng",
    description: "Da sáng mịn, rạng rỡ",
  },
  "vcut-soft-beauty": {
    label: "Mềm mại",
    description: "Làm đẹp da mềm mại",
  },
  "vcut-golden-skin": {
    label: "Da vàng",
    description: "Da vàng óng nắng",
  },
  "vcut-porcelain": {
    label: "Sứ",
    description: "Da trắng sứ mịn",
  },
  "vcut-duotone-magenta": {
    label: "2 tông magenta",
    description: "Duotone đen-magenta nghệ thuật",
  },
  "vcut-duotone-cyan-orange": {
    label: "2 tông cyan-cam",
    description: "Duotone cyan-cam tương phản",
  },
  "vcut-infrared-false": {
    label: "Sai hồng ngoại",
    description: "Đảo kênh màu kiểu hồng ngoại giả",
  },
  "vcut-solarized": {
    label: "Solar hóa",
    description: "Hiệu ứng solarization đảo sáng",
  },
  // --- batch K6 Phase 6 ---
  "vcut-lagoon": {
    label: "Đầm phá",
    description: "Xanh ngọc biển nông, bão hoà cao",
  },
  "vcut-deep-sea": {
    label: "Biển sâu",
    description: "Xanh đậm, tối, lạnh",
  },
  "vcut-coral-reef": {
    label: "Rạn san hô",
    description: "Ấm, rực rỡ như san hô",
  },
  "vcut-santorini": {
    label: "Santorini",
    description: "Trắng xanh Địa Trung Hải",
  },
  "vcut-bali-sunset": {
    label: "Hoàng hôn Bali",
    description: "Vàng cam hoàng hôn nhiệt đới",
  },
  "vcut-coffee-roast": {
    label: "Cà phê rang",
    description: "Nâu ấm, tương phản rõ",
  },
  "vcut-matcha": {
    label: "Matcha",
    description: "Xanh lá trà, tươi mát",
  },
  "vcut-candy-pop": {
    label: "Kẹo ngọt",
    description: "Bão hoà cực cao, vui nhộn",
  },
  "vcut-champagne": {
    label: "Sâm panh",
    description: "Vàng nhạt, sáng, nhẹ nhàng",
  },
  "vcut-blood-moon": {
    label: "Trăng máu",
    description: "Đỏ tối, u ám",
  },
  "vcut-graveyard-fog": {
    label: "Sương nghĩa địa",
    description: "Xám mờ, lạnh, ít màu",
  },
  "vcut-toxic-green": {
    label: "Xanh độc",
    description: "Xanh lá gắt, độc hại",
  },
  "vcut-midnight-purple": {
    label: "Tím nửa đêm",
    description: "Tím tối, huyền bí",
  },
  "vcut-crt-green": {
    label: "Màn hình CRT xanh",
    description: "Đơn sắc xanh lá màn hình cũ",
  },
  "vcut-terminal-amber": {
    label: "Terminal hổ phách",
    description: "Đơn sắc hổ phách terminal",
  },
  "vcut-floppy-purple": {
    label: "Tím floppy",
    description: "Tím retro thập niên 90",
  },
  "vcut-vaporwave-sunset": {
    label: "Hoàng hôn vaporwave",
    description: "Hồng tím hoàng hôn synth",
  },
  "vcut-blush-pink": {
    label: "Hồng má",
    description: "Hồng nhẹ, sáng da",
  },
  "vcut-ivory": {
    label: "Ngà voi",
    description: "Trắng ngà, mềm, sáng",
  },
  "vcut-silk-white": {
    label: "Lụa trắng",
    description: "Trắng mịn, ít màu",
  },
  "vcut-stadium-night": {
    label: "Đêm sân vận động",
    description: "Tương phản cao dưới đèn đêm",
  },
  "vcut-concert-laser": {
    label: "Laser hòa nhạc",
    description: "Rực rỡ, tím laser sân khấu",
  },
  "vcut-vinyl-warm": {
    label: "Đĩa than ấm",
    description: "Nâu ấm cổ điển",
  },
  "vcut-bw-blueprint": {
    label: "Đơn sắc bản vẽ",
    description: "Đơn sắc xanh bản thiết kế",
  },
  "vcut-bw-sepia-deep": {
    label: "Nâu đỏ đậm",
    description: "Đơn sắc nâu đỏ cổ",
  },
  "vcut-bw-night-green": {
    label: "Xanh đêm",
    description: "Đơn sắc xanh lá đêm",
  },
  "vcut-solar-flare": {
    label: "Lóe mặt trời",
    description: "Chói sáng, vàng rực",
  },
  "vcut-prism": {
    label: "Lăng kính",
    description: "Lệch kênh màu cầu vồng",
  },
  "vcut-acid-rain": {
    label: "Mưa axit",
    description: "Xanh lá lệch kênh, gắt",
  },
  "vcut-synthwave-grid": {
    label: "Lưới synthwave",
    description: "Hồng tím neon thập niên 80",
  },
  "vcut-monsoon-rain": {
    label: "Mưa mùa hạ",
    description: "Mưa lạnh, xanh dương",
  },
  "vcut-saigon-night": {
    label: "Đêm Sài Gòn",
    description: "Neon đêm, tương phản cao",
  },
  "vcut-hanoi-autumn": {
    label: "Thu Hà Nội",
    description: "Vàng ấm, dịu",
  },
  "vcut-lantern-fest": {
    label: "Đèn lồng",
    description: "Đỏ vàng rực",
  },
  "vcut-rice-terrace": {
    label: "Ruộng bậc thang",
    description: "Xanh lá tươi",
  },
  "vcut-midnight-market": {
    label: "Chợ đêm",
    description: "Neon ấm, đậm",
  },
  "vcut-cherry-festival": {
    label: "Lễ hội anh đào",
    description: "Hồng sáng, dịu",
  },
  "vcut-glacier-blue": {
    label: "Băng hà xanh",
    description: "Xanh băng lạnh",
  },
  "vcut-meadow-light": {
    label: "Đồng cỏ sáng",
    description: "Xanh sáng, nhẹ",
  },
  "vcut-bamboo-green": {
    label: "Tre xanh",
    description: "Xanh tre đậm",
  },
  "vcut-lotus-pink": {
    label: "Sen hồng",
    description: "Hồng dịu, sáng",
  },
  "vcut-bubble-tea": {
    label: "Trà sữa",
    description: "Nâu sữa ấm, sáng",
  },
  "vcut-honey-glow": {
    label: "Mật ong sáng",
    description: "Vàng mật ong",
  },
  "vcut-chili-ember": {
    label: "Ớt than hồng",
    description: "Đỏ gắt, tương phản",
  },
  "vcut-typhoon-grey": {
    label: "Xám bão",
    description: "Khử bão hoà, lạnh",
  },
  "vcut-ember-night": {
    label: "Than đêm",
    description: "Đỏ tối, trầm",
  },
  "vcut-noir-smoke": {
    label: "Khói noir",
    description: "Gần đơn sắc, khói",
  },
  "vcut-silk-road": {
    label: "Con đường tơ lụa",
    description: "Ấm cổ điển",
  },
  "vcut-opal-dream": {
    label: "Mơ đá opal",
    description: "Tím xanh mơ, sáng",
  },
  "vcut-coral-dawn": {
    label: "Bình minh san hô",
    description: "Hồng cam bình minh",
  },
};

/** Kiểm tra một giá trị có phải LutId hợp lệ không. */
export function isLutId(v: unknown): v is LutId {
  return (
    typeof v === "string" &&
    (LUT_IDS as readonly string[]).includes(v)
  );
}

/** Tên file .cube tương ứng với một LutId. */
export function lutFileName(id: LutId): string {
  return `${id}.cube`;
}

/** Bộ lọc màu áp cho một video clip. */
export interface VideoFilter {
  /**
   * Id LUT trong catalog (vd "cartcut-teal-orange") hoặc LUT user tự nhập
   * (vd "user-my-look"). Không đặt = không lọc.
   */
  lut?: LutId | UserLutId;
  /** Chỉnh màu thủ công (brightness/contrast/...). Áp TRƯỚC LUT trong render. */
  color?: ColorAdjust;
}

/** Validate VideoFilter, trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateVideoFilter(f: unknown): string[] {
  if (f === undefined || f === null) return [];
  if (typeof f !== "object" || Array.isArray(f)) {
    return ["filter phải là một object"];
  }
  const errors: string[] = [];
  const lut = (f as Record<string, unknown>).lut;
  // LUT user chỉ kiểm tra định dạng id ở đây; file .cube tương ứng được
  // kiểm tra tồn tại lúc build filter trong render worker.
  if (lut !== undefined && !isLutId(lut) && !isUserLutId(lut)) {
    errors.push(
      `filter.lut không hợp lệ: ${JSON.stringify(lut)} ` +
      `(chỉ chấp nhận id trong catalog hoặc dạng "user-<slug>")`
    );
  }
  // R1-075: chỉnh màu thủ công
  for (const m of validateColorAdjust((f as Record<string, unknown>).color)) {
    errors.push(m);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Module augmentation: gắn `filter?` vào VideoClip mà KHÔNG sửa index.ts.
// (index.ts của agent khác — parent sẽ tích hợp chính thức sau.)
// ---------------------------------------------------------------------------
import "./index.js";

declare module "./index.js" {
  interface VideoClip {
    filter?: VideoFilter;
  }
}
