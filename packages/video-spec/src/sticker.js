/**
 * sticker.ts — Định nghĩa sticker overlay cho video-spec.
 *
 * Sticker = ảnh PNG (nền trong suốt) dán lên video tại vị trí/tỉ lệ/độ mờ
 * do người dùng chỉnh, kiểu CapCut.
 *
 * NGUYÊN TẮC (giống index.ts): chỉ đưa vào spec những gì render được THẬT.
 * Render worker triển khai bằng FFmpeg overlay (xem server/render/src/sticker.js).
 *
 * Tích hợp còn thiếu (cho agent chính):
 * - Thêm "sticker" vào union TrackKind trong index.ts
 * - Store/UI: track sticker, panel, preview
 * File này KHÔNG sửa index.ts (theo phân công) — panel UI tự kiểm tra
 * `clip.kind === "sticker"` bằng type guard bên dưới.
 */
export const STICKER_DEFAULTS = {
    x: 0.5,
    y: 0.5,
    scale: 0.25,
    opacity: 1,
    rotation: 0,
};
export const STICKER_CATEGORIES = [
    { id: "emoji", label: "Emoji", labelKey: "sticker.cat.emoji" },
    { id: "shapes", label: "Hình khối", labelKey: "sticker.cat.shapes" },
    { id: "arrows", label: "Mũi tên", labelKey: "sticker.cat.arrows" },
    { id: "badges", label: "Huy hiệu", labelKey: "sticker.cat.badges" },
    { id: "bubbles", label: "Bong bóng", labelKey: "sticker.cat.bubbles" },
];
/** Thư viện sticker mẫu đi kèm dự án (tự vẽ 100%, xem assets/stickers/SOURCES.md). */
export const STICKER_LIBRARY = [
    // --- batch 1 (2026-10-19) ---
    { file: "star.png", label: "Ngôi sao", labelKey: "sticker.item.star", category: "shapes" },
    { file: "heart.png", label: "Trái tim", labelKey: "sticker.item.heart", category: "emoji" },
    { file: "arrow-right.png", label: "Mũi tên", labelKey: "sticker.item.arrow-right", category: "arrows" },
    { file: "lightning.png", label: "Tia sét", labelKey: "sticker.item.lightning", category: "emoji" },
    { file: "badge.png", label: "Huy hiệu", labelKey: "sticker.item.badge", category: "badges" },
    { file: "bubble.png", label: "Bong bóng chat", labelKey: "sticker.item.bubble", category: "bubbles" },
    // --- batch 2 (2026-10-19, R1-078) ---
    { file: "smile.png", label: "Mặt cười", labelKey: "sticker.item.smile", category: "emoji" },
    { file: "wink.png", label: "Mắt nháy", labelKey: "sticker.item.wink", category: "emoji" },
    { file: "laugh.png", label: "Cười lớn", labelKey: "sticker.item.laugh", category: "emoji" },
    { file: "cool.png", label: "Ngầu", labelKey: "sticker.item.cool", category: "emoji" },
    { file: "party.png", label: "Tiệc tùng", labelKey: "sticker.item.party", category: "emoji" },
    { file: "fire.png", label: "Ngọn lửa", labelKey: "sticker.item.fire", category: "emoji" },
    { file: "shape-circle.png", label: "Hình tròn", labelKey: "sticker.item.shape-circle", category: "shapes" },
    { file: "shape-square.png", label: "Hình vuông", labelKey: "sticker.item.shape-square", category: "shapes" },
    { file: "shape-triangle.png", label: "Tam giác", labelKey: "sticker.item.shape-triangle", category: "shapes" },
    { file: "shape-diamond.png", label: "Hình thoi", labelKey: "sticker.item.shape-diamond", category: "shapes" },
    { file: "shape-plus.png", label: "Dấu cộng", labelKey: "sticker.item.shape-plus", category: "shapes" },
    { file: "arrow-up.png", label: "Mũi tên lên", labelKey: "sticker.item.arrow-up", category: "arrows" },
    { file: "arrow-down.png", label: "Mũi tên xuống", labelKey: "sticker.item.arrow-down", category: "arrows" },
    { file: "arrow-left.png", label: "Mũi tên trái", labelKey: "sticker.item.arrow-left", category: "arrows" },
    { file: "arrow-curved.png", label: "Mũi tên cong", labelKey: "sticker.item.arrow-curved", category: "arrows" },
    { file: "arrow-double.png", label: "Mũi tên đôi", labelKey: "sticker.item.arrow-double", category: "arrows" },
    { file: "badge-check.png", label: "Tích xanh", labelKey: "sticker.item.badge-check", category: "badges" },
    { file: "badge-cross.png", label: "Dấu X đỏ", labelKey: "sticker.item.badge-cross", category: "badges" },
    { file: "badge-medal.png", label: "Huy chương", labelKey: "sticker.item.badge-medal", category: "badges" },
    { file: "badge-crown.png", label: "Vương miện", labelKey: "sticker.item.badge-crown", category: "badges" },
    { file: "bubble-speech.png", label: "Bóng thoại", labelKey: "sticker.item.bubble-speech", category: "bubbles" },
    { file: "bubble-thought.png", label: "Bóng suy nghĩ", labelKey: "sticker.item.bubble-thought", category: "bubbles" },
    { file: "bubble-shout.png", label: "Bóng hét", labelKey: "sticker.item.bubble-shout", category: "bubbles" },
    { file: "bubble-tag.png", label: "Thẻ giá", labelKey: "sticker.item.bubble-tag", category: "bubbles" },
    // --- batch 3 (2026-10-19, StickerHarvest: Twemoji CC-BY 4.0 + Noto Emoji Apache-2.0) ---
    { file: "twemoji-1f600.png", label: "Mặt cười toe", labelKey: "sticker.item.twemoji-1f600", category: "emoji" },
    { file: "twemoji-1f601.png", label: "Cười nhe răng", labelKey: "sticker.item.twemoji-1f601", category: "emoji" },
    { file: "twemoji-1f602.png", label: "Cười ra nước mắt", labelKey: "sticker.item.twemoji-1f602", category: "emoji" },
    { file: "twemoji-1f603.png", label: "Mặt cười lớn", labelKey: "sticker.item.twemoji-1f603", category: "emoji" },
    { file: "twemoji-1f604.png", label: "Cười tít mắt", labelKey: "sticker.item.twemoji-1f604", category: "emoji" },
    { file: "twemoji-1f609.png", label: "Nháy mắt", labelKey: "sticker.item.twemoji-1f609", category: "emoji" },
    { file: "twemoji-1f60a.png", label: "Cười mỉm", labelKey: "sticker.item.twemoji-1f60a", category: "emoji" },
    { file: "twemoji-1f60d.png", label: "Mắt trái tim", labelKey: "sticker.item.twemoji-1f60d", category: "emoji" },
    { file: "twemoji-1f60e.png", label: "Đeo kính đen", labelKey: "sticker.item.twemoji-1f60e", category: "emoji" },
    { file: "twemoji-1f618.png", label: "Hôn gió", labelKey: "sticker.item.twemoji-1f618", category: "emoji" },
    { file: "twemoji-1f61c.png", label: "Lè lưỡi nháy mắt", labelKey: "sticker.item.twemoji-1f61c", category: "emoji" },
    { file: "twemoji-1f61d.png", label: "Lè lưỡi", labelKey: "sticker.item.twemoji-1f61d", category: "emoji" },
    { file: "twemoji-1f622.png", label: "Khóc", labelKey: "sticker.item.twemoji-1f622", category: "emoji" },
    { file: "twemoji-1f62d.png", label: "Khóc nức nở", labelKey: "sticker.item.twemoji-1f62d", category: "emoji" },
    { file: "twemoji-1f631.png", label: "Hét sợ hãi", labelKey: "sticker.item.twemoji-1f631", category: "emoji" },
    { file: "twemoji-1f621.png", label: "Giận dữ", labelKey: "sticker.item.twemoji-1f621", category: "emoji" },
    { file: "twemoji-1f92f.png", label: "Nổ não", labelKey: "sticker.item.twemoji-1f92f", category: "emoji" },
    { file: "twemoji-1f929.png", label: "Mắt ngôi sao", labelKey: "sticker.item.twemoji-1f929", category: "emoji" },
    { file: "twemoji-1f923.png", label: "Cười lăn", labelKey: "sticker.item.twemoji-1f923", category: "emoji" },
    { file: "twemoji-1f973.png", label: "Ăn mừng", labelKey: "sticker.item.twemoji-1f973", category: "emoji" },
    { file: "twemoji-1f970.png", label: "Yêu thương", labelKey: "sticker.item.twemoji-1f970", category: "emoji" },
    { file: "twemoji-1f97a.png", label: "Mắt cún con", labelKey: "sticker.item.twemoji-1f97a", category: "emoji" },
    { file: "twemoji-1f60f.png", label: "Cười nhếch mép", labelKey: "sticker.item.twemoji-1f60f", category: "emoji" },
    { file: "twemoji-1f644.png", label: "Đảo mắt", labelKey: "sticker.item.twemoji-1f644", category: "emoji" },
    { file: "twemoji-1f643.png", label: "Mặt ngược", labelKey: "sticker.item.twemoji-1f643", category: "emoji" },
    { file: "twemoji-1f913.png", label: "Mọt sách", labelKey: "sticker.item.twemoji-1f913", category: "emoji" },
    { file: "twemoji-1f920.png", label: "Cao bồi", labelKey: "sticker.item.twemoji-1f920", category: "emoji" },
    { file: "twemoji-1f921.png", label: "Chú hề", labelKey: "sticker.item.twemoji-1f921", category: "emoji" },
    { file: "twemoji-1f916.png", label: "Robot", labelKey: "sticker.item.twemoji-1f916", category: "emoji" },
    { file: "twemoji-1f917.png", label: "Ôm", labelKey: "sticker.item.twemoji-1f917", category: "emoji" },
    { file: "twemoji-1f44d.png", label: "Like", labelKey: "sticker.item.twemoji-1f44d", category: "emoji" },
    { file: "twemoji-1f44e.png", label: "Dislike", labelKey: "sticker.item.twemoji-1f44e", category: "emoji" },
    { file: "twemoji-1f44f.png", label: "Vỗ tay", labelKey: "sticker.item.twemoji-1f44f", category: "emoji" },
    { file: "twemoji-1f64c.png", label: "Giơ tay ăn mừng", labelKey: "sticker.item.twemoji-1f64c", category: "emoji" },
    { file: "twemoji-1f64f.png", label: "Chắp tay", labelKey: "sticker.item.twemoji-1f64f", category: "emoji" },
    { file: "twemoji-1f91d.png", label: "Bắt tay", labelKey: "sticker.item.twemoji-1f91d", category: "emoji" },
    { file: "twemoji-1f91e.png", label: "Cầu may", labelKey: "sticker.item.twemoji-1f91e", category: "emoji" },
    { file: "twemoji-270c.png", label: "Chữ V chiến thắng", labelKey: "sticker.item.twemoji-270c", category: "emoji" },
    { file: "twemoji-1f44c.png", label: "OK", labelKey: "sticker.item.twemoji-1f44c", category: "emoji" },
    { file: "twemoji-1f44b.png", label: "Vẫy tay", labelKey: "sticker.item.twemoji-1f44b", category: "emoji" },
    { file: "twemoji-270a.png", label: "Nắm đấm", labelKey: "sticker.item.twemoji-270a", category: "emoji" },
    { file: "twemoji-1f918.png", label: "Rock on", labelKey: "sticker.item.twemoji-1f918", category: "emoji" },
    { file: "twemoji-2764.png", label: "Trái tim đỏ", labelKey: "sticker.item.twemoji-2764", category: "emoji" },
    { file: "twemoji-1f495.png", label: "Hai trái tim", labelKey: "sticker.item.twemoji-1f495", category: "emoji" },
    { file: "twemoji-1f496.png", label: "Tim lấp lánh", labelKey: "sticker.item.twemoji-1f496", category: "emoji" },
    { file: "twemoji-1f498.png", label: "Tim mũi tên", labelKey: "sticker.item.twemoji-1f498", category: "emoji" },
    { file: "twemoji-1f499.png", label: "Tim xanh dương", labelKey: "sticker.item.twemoji-1f499", category: "emoji" },
    { file: "twemoji-1f49a.png", label: "Tim xanh lá", labelKey: "sticker.item.twemoji-1f49a", category: "emoji" },
    { file: "twemoji-1f49b.png", label: "Tim vàng", labelKey: "sticker.item.twemoji-1f49b", category: "emoji" },
    { file: "twemoji-1f49c.png", label: "Tim tím", labelKey: "sticker.item.twemoji-1f49c", category: "emoji" },
    { file: "twemoji-1f49d.png", label: "Tim ruy băng", labelKey: "sticker.item.twemoji-1f49d", category: "emoji" },
    { file: "twemoji-1f494.png", label: "Tim vỡ", labelKey: "sticker.item.twemoji-1f494", category: "emoji" },
    { file: "twemoji-1f9e1.png", label: "Tim cam", labelKey: "sticker.item.twemoji-1f9e1", category: "emoji" },
    { file: "twemoji-1f5a4.png", label: "Tim đen", labelKey: "sticker.item.twemoji-1f5a4", category: "emoji" },
    { file: "twemoji-1f389.png", label: "Pháo giấy", labelKey: "sticker.item.twemoji-1f389", category: "emoji" },
    { file: "twemoji-1f38a.png", label: "Tung hoa", labelKey: "sticker.item.twemoji-1f38a", category: "emoji" },
    { file: "twemoji-1f382.png", label: "Bánh sinh nhật", labelKey: "sticker.item.twemoji-1f382", category: "emoji" },
    { file: "twemoji-1f381.png", label: "Quà tặng", labelKey: "sticker.item.twemoji-1f381", category: "emoji" },
    { file: "twemoji-1f388.png", label: "Bong bóng", labelKey: "sticker.item.twemoji-1f388", category: "emoji" },
    { file: "twemoji-2728.png", label: "Lấp lánh", labelKey: "sticker.item.twemoji-2728", category: "emoji" },
    { file: "twemoji-1f31f.png", label: "Ngôi sao sáng", labelKey: "sticker.item.twemoji-1f31f", category: "emoji" },
    { file: "twemoji-2b50.png", label: "Ngôi sao", labelKey: "sticker.item.twemoji-2b50", category: "emoji" },
    { file: "twemoji-1f3c6.png", label: "Cúp", labelKey: "sticker.item.twemoji-1f3c6", category: "emoji" },
    { file: "twemoji-1f947.png", label: "Huy chương vàng", labelKey: "sticker.item.twemoji-1f947", category: "emoji" },
    { file: "twemoji-1f3af.png", label: "Trúng đích", labelKey: "sticker.item.twemoji-1f3af", category: "emoji" },
    { file: "twemoji-1f42d.png", label: "Chuột", labelKey: "sticker.item.twemoji-1f42d", category: "emoji" },
    { file: "twemoji-1f439.png", label: "Chuột hamster", labelKey: "sticker.item.twemoji-1f439", category: "emoji" },
    { file: "twemoji-1f424.png", label: "Gà con", labelKey: "sticker.item.twemoji-1f424", category: "emoji" },
    { file: "twemoji-1f99d.png", label: "Gấu mèo", labelKey: "sticker.item.twemoji-1f99d", category: "emoji" },
    { file: "twemoji-1f419.png", label: "Bạch tuộc", labelKey: "sticker.item.twemoji-1f419", category: "emoji" },
    { file: "twemoji-1f420.png", label: "Cá nhiệt đới", labelKey: "sticker.item.twemoji-1f420", category: "emoji" },
    { file: "twemoji-1f41d.png", label: "Ong", labelKey: "sticker.item.twemoji-1f41d", category: "emoji" },
    { file: "twemoji-1f98b.png", label: "Bướm", labelKey: "sticker.item.twemoji-1f98b", category: "emoji" },
    { file: "twemoji-1f32d.png", label: "Hotdog", labelKey: "sticker.item.twemoji-1f32d", category: "emoji" },
    { file: "twemoji-1f35f.png", label: "Khoai tây chiên", labelKey: "sticker.item.twemoji-1f35f", category: "emoji" },
    { file: "twemoji-1f368.png", label: "Kem ly", labelKey: "sticker.item.twemoji-1f368", category: "emoji" },
    { file: "twemoji-1f36c.png", label: "Kẹo", labelKey: "sticker.item.twemoji-1f36c", category: "emoji" },
    { file: "twemoji-1f370.png", label: "Bánh ngọt", labelKey: "sticker.item.twemoji-1f370", category: "emoji" },
    { file: "twemoji-1f34e.png", label: "Táo đỏ", labelKey: "sticker.item.twemoji-1f34e", category: "emoji" },
    { file: "twemoji-1f353.png", label: "Dâu tây", labelKey: "sticker.item.twemoji-1f353", category: "emoji" },
    { file: "twemoji-1f34d.png", label: "Dứa", labelKey: "sticker.item.twemoji-1f34d", category: "emoji" },
    { file: "twemoji-1f4a4.png", label: "Buồn ngủ", labelKey: "sticker.item.twemoji-1f4a4", category: "emoji" },
    { file: "twemoji-1f4ab.png", label: "Chóng mặt", labelKey: "sticker.item.twemoji-1f4ab", category: "emoji" },
    { file: "twemoji-1f6a8.png", label: "Đèn cảnh sát", labelKey: "sticker.item.twemoji-1f6a8", category: "emoji" },
    { file: "twemoji-1f3b2.png", label: "Xúc xắc", labelKey: "sticker.item.twemoji-1f3b2", category: "emoji" },
    { file: "twemoji-1f3ac.png", label: "Clapperboard", labelKey: "sticker.item.twemoji-1f3ac", category: "emoji" },
    { file: "twemoji-1f3a4.png", label: "Micro", labelKey: "sticker.item.twemoji-1f3a4", category: "emoji" },
    { file: "twemoji-1f3a7.png", label: "Tai nghe", labelKey: "sticker.item.twemoji-1f3a7", category: "emoji" },
    { file: "twemoji-1f4f9.png", label: "Máy quay", labelKey: "sticker.item.twemoji-1f4f9", category: "emoji" },
    { file: "twemoji-1f4da.png", label: "Sách", labelKey: "sticker.item.twemoji-1f4da", category: "emoji" },
    { file: "twemoji-1f393.png", label: "Mũ tốt nghiệp", labelKey: "sticker.item.twemoji-1f393", category: "emoji" },
    { file: "twemoji-26bd.png", label: "Bóng đá", labelKey: "sticker.item.twemoji-26bd", category: "emoji" },
    { file: "twemoji-1f3c0.png", label: "Bóng rổ", labelKey: "sticker.item.twemoji-1f3c0", category: "emoji" },
    { file: "twemoji-1f94a.png", label: "Găng boxing", labelKey: "sticker.item.twemoji-1f94a", category: "emoji" },
    { file: "noto-1f436.png", label: "Chó", labelKey: "sticker.item.noto-1f436", category: "emoji" },
    { file: "noto-1f431.png", label: "Mèo", labelKey: "sticker.item.noto-1f431", category: "emoji" },
    { file: "noto-1f43c.png", label: "Gấu trúc", labelKey: "sticker.item.noto-1f43c", category: "emoji" },
    { file: "noto-1f43b.png", label: "Gấu", labelKey: "sticker.item.noto-1f43b", category: "emoji" },
    { file: "noto-1f98a.png", label: "Cáo", labelKey: "sticker.item.noto-1f98a", category: "emoji" },
    { file: "noto-1f430.png", label: "Thỏ", labelKey: "sticker.item.noto-1f430", category: "emoji" },
    { file: "noto-1f428.png", label: "Gấu túi", labelKey: "sticker.item.noto-1f428", category: "emoji" },
    { file: "noto-1f427.png", label: "Chim cánh cụt", labelKey: "sticker.item.noto-1f427", category: "emoji" },
    { file: "noto-1f426.png", label: "Chim", labelKey: "sticker.item.noto-1f426", category: "emoji" },
    { file: "noto-1f438.png", label: "Ếch", labelKey: "sticker.item.noto-1f438", category: "emoji" },
    { file: "noto-1f981.png", label: "Sư tử", labelKey: "sticker.item.noto-1f981", category: "emoji" },
    { file: "noto-1f42f.png", label: "Hổ", labelKey: "sticker.item.noto-1f42f", category: "emoji" },
    { file: "noto-1f984.png", label: "Kỳ lân", labelKey: "sticker.item.noto-1f984", category: "emoji" },
    { file: "noto-1f435.png", label: "Khỉ", labelKey: "sticker.item.noto-1f435", category: "emoji" },
    { file: "noto-1f43e.png", label: "Dấu chân", labelKey: "sticker.item.noto-1f43e", category: "emoji" },
    { file: "noto-1f354.png", label: "Burger", labelKey: "sticker.item.noto-1f354", category: "emoji" },
    { file: "noto-1f355.png", label: "Pizza", labelKey: "sticker.item.noto-1f355", category: "emoji" },
    { file: "noto-1f366.png", label: "Kem", labelKey: "sticker.item.noto-1f366", category: "emoji" },
    { file: "noto-1f36a.png", label: "Bánh quy", labelKey: "sticker.item.noto-1f36a", category: "emoji" },
    { file: "noto-1f36b.png", label: "Socola", labelKey: "sticker.item.noto-1f36b", category: "emoji" },
    { file: "noto-1f36d.png", label: "Kẹo mút", labelKey: "sticker.item.noto-1f36d", category: "emoji" },
    { file: "noto-1f37f.png", label: "Bỏng ngô", labelKey: "sticker.item.noto-1f37f", category: "emoji" },
    { file: "noto-1f964.png", label: "Trà sữa", labelKey: "sticker.item.noto-1f964", category: "emoji" },
    { file: "noto-2615.png", label: "Cà phê", labelKey: "sticker.item.noto-2615", category: "emoji" },
    { file: "noto-1f37a.png", label: "Bia", labelKey: "sticker.item.noto-1f37a", category: "emoji" },
    { file: "noto-2600.png", label: "Mặt trời", labelKey: "sticker.item.noto-2600", category: "emoji" },
    { file: "noto-1f319.png", label: "Mặt trăng", labelKey: "sticker.item.noto-1f319", category: "emoji" },
    { file: "noto-1f308.png", label: "Cầu vồng", labelKey: "sticker.item.noto-1f308", category: "emoji" },
    { file: "noto-2744.png", label: "Bông tuyết", labelKey: "sticker.item.noto-2744", category: "emoji" },
    { file: "noto-1f525.png", label: "Lửa", labelKey: "sticker.item.noto-1f525", category: "emoji" },
    { file: "noto-1f30a.png", label: "Sóng biển", labelKey: "sticker.item.noto-1f30a", category: "emoji" },
    { file: "noto-1f340.png", label: "Cỏ 4 lá", labelKey: "sticker.item.noto-1f340", category: "emoji" },
    { file: "noto-1f33b.png", label: "Hoa hướng dương", labelKey: "sticker.item.noto-1f33b", category: "emoji" },
    { file: "noto-1f332.png", label: "Cây thông", labelKey: "sticker.item.noto-1f332", category: "emoji" },
    { file: "noto-2601.png", label: "Mây", labelKey: "sticker.item.noto-2601", category: "emoji" },
    { file: "noto-1f4a1.png", label: "Bóng đèn", labelKey: "sticker.item.noto-1f4a1", category: "emoji" },
    { file: "noto-1f4af.png", label: "100 điểm", labelKey: "sticker.item.noto-1f4af", category: "emoji" },
    { file: "noto-1f4a5.png", label: "Vụ nổ", labelKey: "sticker.item.noto-1f4a5", category: "emoji" },
    { file: "noto-1f4a9.png", label: "Phân", labelKey: "sticker.item.noto-1f4a9", category: "emoji" },
    { file: "noto-1f4ac.png", label: "Bong bóng chat", labelKey: "sticker.item.noto-1f4ac", category: "emoji" },
    { file: "noto-1f4ad.png", label: "Suy nghĩ", labelKey: "sticker.item.noto-1f4ad", category: "emoji" },
    { file: "noto-2753.png", label: "Dấu hỏi", labelKey: "sticker.item.noto-2753", category: "emoji" },
    { file: "noto-2757.png", label: "Dấu chấm than", labelKey: "sticker.item.noto-2757", category: "emoji" },
    { file: "noto-2705.png", label: "Tích xanh", labelKey: "sticker.item.noto-2705", category: "emoji" },
    { file: "noto-274c.png", label: "Dấu X", labelKey: "sticker.item.noto-274c", category: "emoji" },
    { file: "noto-1f6ab.png", label: "Cấm", labelKey: "sticker.item.noto-1f6ab", category: "emoji" },
    { file: "noto-26a0.png", label: "Cảnh báo", labelKey: "sticker.item.noto-26a0", category: "emoji" },
    { file: "noto-1f511.png", label: "Chìa khóa", labelKey: "sticker.item.noto-1f511", category: "emoji" },
    { file: "noto-1f4b0.png", label: "Túi tiền", labelKey: "sticker.item.noto-1f4b0", category: "emoji" },
    { file: "noto-1f3b5.png", label: "Nốt nhạc", labelKey: "sticker.item.noto-1f3b5", category: "emoji" },
    { file: "noto-1f3b6.png", label: "Nhạc", labelKey: "sticker.item.noto-1f3b6", category: "emoji" },
    { file: "noto-1f4a7.png", label: "Giọt nước", labelKey: "sticker.item.noto-1f4a7", category: "emoji" },
    { file: "noto-23f0.png", label: "Đồng hồ báo thức", labelKey: "sticker.item.noto-23f0", category: "emoji" },
    { file: "noto-1f50d.png", label: "Kính lúp", labelKey: "sticker.item.noto-1f50d", category: "emoji" },
    { file: "noto-1f3a8.png", label: "Bảng màu", labelKey: "sticker.item.noto-1f3a8", category: "emoji" },
    { file: "noto-1f605.png", label: "Cười đổ mồ hôi", labelKey: "sticker.item.noto-1f605", category: "emoji" },
    { file: "noto-1f606.png", label: "Cười lớn", labelKey: "sticker.item.noto-1f606", category: "emoji" },
    { file: "noto-1f607.png", label: "Thiên thần", labelKey: "sticker.item.noto-1f607", category: "emoji" },
    { file: "noto-1f608.png", label: "Ác quỷ", labelKey: "sticker.item.noto-1f608", category: "emoji" },
    { file: "noto-1f60b.png", label: "Thèm ăn", labelKey: "sticker.item.noto-1f60b", category: "emoji" },
    { file: "noto-1f60c.png", label: "Nhẹ nhõm", labelKey: "sticker.item.noto-1f60c", category: "emoji" },
    { file: "noto-1f61b.png", label: "Lè lưỡi", labelKey: "sticker.item.noto-1f61b", category: "emoji" },
    { file: "noto-1f61e.png", label: "Buồn", labelKey: "sticker.item.noto-1f61e", category: "emoji" },
    { file: "noto-1f61f.png", label: "Lo lắng", labelKey: "sticker.item.noto-1f61f", category: "emoji" },
    { file: "noto-1f620.png", label: "Bực mình", labelKey: "sticker.item.noto-1f620", category: "emoji" },
    { file: "noto-1f62a.png", label: "Buồn ngủ", labelKey: "sticker.item.noto-1f62a", category: "emoji" },
    { file: "noto-1f62c.png", label: "Nhăn mặt", labelKey: "sticker.item.noto-1f62c", category: "emoji" },
    { file: "noto-1f62e.png", label: "Ngạc nhiên", labelKey: "sticker.item.noto-1f62e", category: "emoji" },
    { file: "noto-1f634.png", label: "Đang ngủ", labelKey: "sticker.item.noto-1f634", category: "emoji" },
    { file: "noto-1f635.png", label: "Chóng mặt", labelKey: "sticker.item.noto-1f635", category: "emoji" },
    { file: "noto-1f637.png", label: "Đeo khẩu trang", labelKey: "sticker.item.noto-1f637", category: "emoji" },
    { file: "noto-1f642.png", label: "Cười nhẹ", labelKey: "sticker.item.noto-1f642", category: "emoji" },
    { file: "noto-1f910.png", label: "Ngậm miệng", labelKey: "sticker.item.noto-1f910", category: "emoji" },
    { file: "noto-1f911.png", label: "Mắt tiền", labelKey: "sticker.item.noto-1f911", category: "emoji" },
    { file: "noto-1f914.png", label: "Suy nghĩ", labelKey: "sticker.item.noto-1f914", category: "emoji" },
    { file: "twemoji-1f63a.png", label: "Mèo cười", labelKey: "sticker.item.twemoji-1f63a", category: "emoji" },
    { file: "twemoji-1f63b.png", label: "Mèo mắt tim", labelKey: "sticker.item.twemoji-1f63b", category: "emoji" },
    { file: "noto-1f649.png", label: "Khỉ bịt tai", labelKey: "sticker.item.noto-1f649", category: "emoji" },
    { file: "noto-1f64a.png", label: "Khỉ bịt mắt", labelKey: "sticker.item.noto-1f64a", category: "emoji" },

    // --- batch 4 (K6 Phase 6, Fluent UI Emoji 3D, MIT) ---
    { file: "fluent-red_heart.png", label: "Trái tim đỏ", labelKey: "sticker.item.fluent-red-heart", category: "emoji" },
    { file: "fluent-fire.png", label: "Lửa", labelKey: "sticker.item.fluent-fire", category: "emoji" },
    { file: "fluent-party_popper.png", label: "Pháo giấy", labelKey: "sticker.item.fluent-party-popper", category: "emoji" },
    { file: "fluent-rocket.png", label: "Tên lửa", labelKey: "sticker.item.fluent-rocket", category: "emoji" },
    { file: "fluent-star.png", label: "Ngôi sao", labelKey: "sticker.item.fluent-star", category: "emoji" },
    { file: "fluent-sparkles.png", label: "Lấp lánh", labelKey: "sticker.item.fluent-sparkles", category: "emoji" },
    { file: "fluent-crown.png", label: "Vương miện", labelKey: "sticker.item.fluent-crown", category: "emoji" },
    { file: "fluent-gem_stone.png", label: "Kim cương", labelKey: "sticker.item.fluent-gem-stone", category: "emoji" },
    { file: "fluent-trophy.png", label: "Cúp vàng", labelKey: "sticker.item.fluent-trophy", category: "emoji" },
    { file: "fluent-soccer_ball.png", label: "Bóng đá", labelKey: "sticker.item.fluent-soccer-ball", category: "emoji" },
    { file: "fluent-cat_face.png", label: "Mặt mèo", labelKey: "sticker.item.fluent-cat-face", category: "emoji" },
    { file: "fluent-dog_face.png", label: "Mặt chó", labelKey: "sticker.item.fluent-dog-face", category: "emoji" },
    { file: "fluent-pizza.png", label: "Pizza", labelKey: "sticker.item.fluent-pizza", category: "emoji" },
    { file: "fluent-beer_mug.png", label: "Cốc bia", labelKey: "sticker.item.fluent-beer-mug", category: "emoji" },
    { file: "fluent-musical_notes.png", label: "Nốt nhạc", labelKey: "sticker.item.fluent-musical-notes", category: "emoji" },
    { file: "fluent-camera.png", label: "Máy ảnh", labelKey: "sticker.item.fluent-camera", category: "emoji" },
    { file: "fluent-video_camera.png", label: "Máy quay", labelKey: "sticker.item.fluent-video-camera", category: "emoji" },
    { file: "fluent-laptop.png", label: "Laptop", labelKey: "sticker.item.fluent-laptop", category: "emoji" },
    { file: "fluent-mobile_phone.png", label: "Điện thoại", labelKey: "sticker.item.fluent-mobile-phone", category: "emoji" },
    { file: "fluent-light_bulb.png", label: "Bóng đèn", labelKey: "sticker.item.fluent-light-bulb", category: "emoji" },
    { file: "fluent-money_bag.png", label: "Túi tiền", labelKey: "sticker.item.fluent-money-bag", category: "emoji" },
    { file: "fluent-balloon.png", label: "Bong bóng", labelKey: "sticker.item.fluent-balloon", category: "emoji" },
    { file: "fluent-rainbow.png", label: "Cầu vồng", labelKey: "sticker.item.fluent-rainbow", category: "emoji" },
    { file: "fluent-sun.png", label: "Mặt trời", labelKey: "sticker.item.fluent-sun", category: "emoji" },
    { file: "fluent-snowflake.png", label: "Bông tuyết", labelKey: "sticker.item.fluent-snowflake", category: "emoji" },
    { file: "fluent-palm_tree.png", label: "Cây dừa", labelKey: "sticker.item.fluent-palm-tree", category: "emoji" },
    { file: "fluent-rose.png", label: "Hoa hồng", labelKey: "sticker.item.fluent-rose", category: "emoji" },
    { file: "fluent-sunflower.png", label: "Hoa hướng dương", labelKey: "sticker.item.fluent-sunflower", category: "emoji" },
    { file: "fluent-grinning_face.png", label: "Mặt cười toe", labelKey: "sticker.item.fluent-grinning-face", category: "emoji" },
    { file: "fluent-face_with_tears_of_joy.png", label: "Cười ra nước mắt", labelKey: "sticker.item.fluent-face-with-tears-of-joy", category: "emoji" },
    { file: "fluent-winking_face.png", label: "Nháy mắt", labelKey: "sticker.item.fluent-winking-face", category: "emoji" },
    { file: "fluent-smiling_face_with_heart-eyes.png", label: "Mắt trái tim", labelKey: "sticker.item.fluent-smiling-face-with-heart-eyes", category: "emoji" },
    { file: "fluent-thinking_face.png", label: "Đang suy nghĩ", labelKey: "sticker.item.fluent-thinking-face", category: "emoji" },
    { file: "fluent-sleeping_face.png", label: "Buồn ngủ", labelKey: "sticker.item.fluent-sleeping-face", category: "emoji" },
    { file: "fluent-angry_face.png", label: "Tức giận", labelKey: "sticker.item.fluent-angry-face", category: "emoji" },
    { file: "fluent-eyes.png", label: "Đôi mắt", labelKey: "sticker.item.fluent-eyes", category: "emoji" },
    { file: "fluent-brain.png", label: "Bộ não", labelKey: "sticker.item.fluent-brain", category: "emoji" },
    { file: "fluent-hot_beverage.png", label: "Đồ uống nóng", labelKey: "sticker.item.fluent-hot-beverage", category: "emoji" },
    { file: "fluent-wrapped_gift.png", label: "Hộp quà", labelKey: "sticker.item.fluent-wrapped-gift", category: "emoji" },
    { file: "fluent-crescent_moon.png", label: "Trăng lưỡi liềm", labelKey: "sticker.item.fluent-crescent-moon", category: "emoji" },
    { file: "fluent-full_moon.png", label: "Trăng tròn", labelKey: "sticker.item.fluent-full-moon", category: "emoji" },
];
/** URL phục vụ sticker mẫu trong web app (Vite serve apps/web/public/). */
export function stickerUrl(file) {
    return `/stickers/${file}`;
}
export function isStickerClip(c) {
    return (typeof c === "object" &&
        c !== null &&
        c["kind"] === "sticker");
}
function isFiniteNumber(x) {
    return typeof x === "number" && Number.isFinite(x);
}
/** Chuẩn hoá sticker: điền giá trị mặc định cho các trường optional. */
export function normalizeStickerClip(c) {
    return {
        kind: "sticker",
        id: c.id,
        src: c.src,
        start: c.start,
        duration: c.duration,
        x: c.x ?? STICKER_DEFAULTS.x,
        y: c.y ?? STICKER_DEFAULTS.y,
        scale: c.scale ?? STICKER_DEFAULTS.scale,
        opacity: c.opacity ?? STICKER_DEFAULTS.opacity,
        rotation: c.rotation ?? STICKER_DEFAULTS.rotation,
        // Đợt 53 J9: giữ key track luôn (kể cả undefined) để khớp
        // normalizeStickerClip() của sticker.ts — trước đây .js bỏ key
        // khi track vắng nên checker mirror bắt lệch (key count 10 vs 11).
        track: c.track,
    };
}
/**
 * Validate một sticker clip. Trả về mảng thông báo lỗi (rỗng = hợp lệ).
 * (Không kiểm tra file tồn tại — việc đó thuộc về validateMedia của render worker.)
 */
export function validateStickerClip(c) {
    const errors = [];
    if (typeof c !== "object" || c === null)
        return ["sticker phải là một object"];
    const s = c;
    const where = `sticker "${String(s["id"] ?? "?")}"`;
    if (s["kind"] !== "sticker")
        errors.push(`${where}: kind phải là "sticker"`);
    if (typeof s["id"] !== "string" || s["id"].length === 0)
        errors.push(`${where}: thiếu id`);
    if (typeof s["src"] !== "string" || s["src"].length === 0)
        errors.push(`${where}: thiếu src (đường dẫn file PNG)`);
    if (!isFiniteNumber(s["start"]) || s["start"] < 0)
        errors.push(`${where}: start phải là số >= 0`);
    if (!isFiniteNumber(s["duration"]) || s["duration"] <= 0)
        errors.push(`${where}: duration phải là số > 0`);
    for (const key of ["x", "y"]) {
        const v = s[key];
        if (v !== undefined && (!isFiniteNumber(v) || v < 0 || v > 1))
            errors.push(`${where}: ${key} phải trong khoảng 0..1, nhận được: ${String(v)}`);
    }
    if (s["scale"] !== undefined && (!isFiniteNumber(s["scale"]) || s["scale"] <= 0))
        errors.push(`${where}: scale phải là số > 0, nhận được: ${String(s["scale"])}`);
    if (s["opacity"] !== undefined &&
        (!isFiniteNumber(s["opacity"]) || s["opacity"] < 0 || s["opacity"] > 1))
        errors.push(`${where}: opacity phải trong khoảng 0..1, nhận được: ${String(s["opacity"])}`);
    if (s["rotation"] !== undefined && !isFiniteNumber(s["rotation"]))
        errors.push(`${where}: rotation phải là số (độ), nhận được: ${String(s["rotation"])}`);
    // Phase 8 Q5: quỹ đạo tracking (validate chi tiết trong tracking.js).
    if (s["track"] !== undefined) {
        const tr = s["track"];
        if (!tr || typeof tr !== "object" || !Array.isArray(tr.points) || tr.points.length === 0) {
            errors.push(`${where}: track.points phải là mảng không rỗng`);
        }
        else {
            if (tr.points.length > 240)
                errors.push(`${where}: track.points tối đa 240 điểm, nhận được: ${tr.points.length}`);
            let prevT = -Infinity;
            tr.points.forEach((p, i) => {
                if (!p || typeof p !== "object") {
                    errors.push(`${where}: track.points[${i}] phải là object`);
                    return;
                }
                if (!isFiniteNumber(p.t) || p.t < 0)
                    errors.push(`${where}: track.points[${i}].t phải là số >= 0`);
                if (!isFiniteNumber(p.x) || p.x < 0 || p.x > 1)
                    errors.push(`${where}: track.points[${i}].x phải là số 0..1`);
                if (!isFiniteNumber(p.y) || p.y < 0 || p.y > 1)
                    errors.push(`${where}: track.points[${i}].y phải là số 0..1`);
                if (isFiniteNumber(p.t)) {
                    if (p.t <= prevT && i > 0)
                        errors.push(`${where}: track.points[${i}].t phải tăng dần`);
                    prevT = p.t;
                }
            });
        }
    }
    return errors;
}
