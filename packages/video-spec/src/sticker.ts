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

/** Clip sticker trên timeline. Thời gian tính bằng GIÂY. */
export interface StickerClip {
  kind: "sticker";
  id: string;
  /** Đường dẫn file PNG (tương đối từ thư mục media của project) */
  src: string;
  /** Vị trí bắt đầu trên timeline (giây) */
  start: number;
  /** Độ dài hiển thị trên timeline (giây) */
  duration: number;
  /** Tâm sticker theo chiều ngang, 0..1 (0.5 = giữa), mặc định 0.5 */
  x?: number;
  /** Tâm sticker theo chiều dọc, 0..1 (0.5 = giữa), mặc định 0.5 */
  y?: number;
  /** Chiều rộng sticker = scale × chiều rộng khung hình, > 0, mặc định 0.25 */
  scale?: number;
  /** 0..1, mặc định 1 */
  opacity?: number;
  /** Góc xoay (độ), mặc định 0 */
  rotation?: number;
  /**
   * Quỹ đạo motion tracking (Phase 8 Q5, optional). Khi có track, vị trí
   * sticker bám theo quỹ đạo (nội suy tuyến tính theo thời gian cục bộ),
   * thắng x/y tĩnh. Quỹ đạo do server/tracking/track.py sinh ra.
   */
  track?: import("./tracking.js").TrackAttachment;
}

export interface StickerTrack {
  id: string;
  kind: "sticker";
  label?: string;
  clips: StickerClip[];
}

export const STICKER_DEFAULTS = {
  x: 0.5,
  y: 0.5,
  scale: 0.25,
  opacity: 1,
  rotation: 0,
} as const;

/** Nhóm phân loại sticker trong thư viện. */
export type StickerCategory = "emoji" | "shapes" | "arrows" | "badges" | "bubbles";

export const STICKER_CATEGORIES: { id: StickerCategory; label: string }[] = [
  { id: "emoji", label: "Emoji" },
  { id: "shapes", label: "Hình khối" },
  { id: "arrows", label: "Mũi tên" },
  { id: "badges", label: "Huy hiệu" },
  { id: "bubbles", label: "Bong bóng" },
];

/** Thư viện sticker mẫu đi kèm dự án (tự vẽ 100%, xem assets/stickers/SOURCES.md). */
export const STICKER_LIBRARY = [
  // --- batch 1 (2026-10-19) ---
  { file: "star.png", label: "Ngôi sao", category: "shapes" as StickerCategory },
  { file: "heart.png", label: "Trái tim", category: "emoji" as StickerCategory },
  { file: "arrow-right.png", label: "Mũi tên", category: "arrows" as StickerCategory },
  { file: "lightning.png", label: "Tia sét", category: "emoji" as StickerCategory },
  { file: "badge.png", label: "Huy hiệu", category: "badges" as StickerCategory },
  { file: "bubble.png", label: "Bong bóng chat", category: "bubbles" as StickerCategory },
  // --- batch 2 (2026-10-19, R1-078) ---
  { file: "smile.png", label: "Mặt cười", category: "emoji" as StickerCategory },
  { file: "wink.png", label: "Mắt nháy", category: "emoji" as StickerCategory },
  { file: "laugh.png", label: "Cười lớn", category: "emoji" as StickerCategory },
  { file: "cool.png", label: "Ngầu", category: "emoji" as StickerCategory },
  { file: "party.png", label: "Tiệc tùng", category: "emoji" as StickerCategory },
  { file: "fire.png", label: "Ngọn lửa", category: "emoji" as StickerCategory },
  { file: "shape-circle.png", label: "Hình tròn", category: "shapes" as StickerCategory },
  { file: "shape-square.png", label: "Hình vuông", category: "shapes" as StickerCategory },
  { file: "shape-triangle.png", label: "Tam giác", category: "shapes" as StickerCategory },
  { file: "shape-diamond.png", label: "Hình thoi", category: "shapes" as StickerCategory },
  { file: "shape-plus.png", label: "Dấu cộng", category: "shapes" as StickerCategory },
  { file: "arrow-up.png", label: "Mũi tên lên", category: "arrows" as StickerCategory },
  { file: "arrow-down.png", label: "Mũi tên xuống", category: "arrows" as StickerCategory },
  { file: "arrow-left.png", label: "Mũi tên trái", category: "arrows" as StickerCategory },
  { file: "arrow-curved.png", label: "Mũi tên cong", category: "arrows" as StickerCategory },
  { file: "arrow-double.png", label: "Mũi tên đôi", category: "arrows" as StickerCategory },
  { file: "badge-check.png", label: "Tích xanh", category: "badges" as StickerCategory },
  { file: "badge-cross.png", label: "Dấu X đỏ", category: "badges" as StickerCategory },
  { file: "badge-medal.png", label: "Huy chương", category: "badges" as StickerCategory },
  { file: "badge-crown.png", label: "Vương miện", category: "badges" as StickerCategory },
  { file: "bubble-speech.png", label: "Bóng thoại", category: "bubbles" as StickerCategory },
  { file: "bubble-thought.png", label: "Bóng suy nghĩ", category: "bubbles" as StickerCategory },
  { file: "bubble-shout.png", label: "Bóng hét", category: "bubbles" as StickerCategory },
  { file: "bubble-tag.png", label: "Thẻ giá", category: "bubbles" as StickerCategory },
  // --- batch 3 (2026-10-19, StickerHarvest: Twemoji CC-BY 4.0 + Noto Emoji Apache-2.0) ---
  { file: "twemoji-1f600.png", label: "Mặt cười toe", category: "emoji" as StickerCategory },
  { file: "twemoji-1f601.png", label: "Cười nhe răng", category: "emoji" as StickerCategory },
  { file: "twemoji-1f602.png", label: "Cười ra nước mắt", category: "emoji" as StickerCategory },
  { file: "twemoji-1f603.png", label: "Mặt cười lớn", category: "emoji" as StickerCategory },
  { file: "twemoji-1f604.png", label: "Cười tít mắt", category: "emoji" as StickerCategory },
  { file: "twemoji-1f609.png", label: "Nháy mắt", category: "emoji" as StickerCategory },
  { file: "twemoji-1f60a.png", label: "Cười mỉm", category: "emoji" as StickerCategory },
  { file: "twemoji-1f60d.png", label: "Mắt trái tim", category: "emoji" as StickerCategory },
  { file: "twemoji-1f60e.png", label: "Đeo kính đen", category: "emoji" as StickerCategory },
  { file: "twemoji-1f618.png", label: "Hôn gió", category: "emoji" as StickerCategory },
  { file: "twemoji-1f61c.png", label: "Lè lưỡi nháy mắt", category: "emoji" as StickerCategory },
  { file: "twemoji-1f61d.png", label: "Lè lưỡi", category: "emoji" as StickerCategory },
  { file: "twemoji-1f622.png", label: "Khóc", category: "emoji" as StickerCategory },
  { file: "twemoji-1f62d.png", label: "Khóc nức nở", category: "emoji" as StickerCategory },
  { file: "twemoji-1f631.png", label: "Hét sợ hãi", category: "emoji" as StickerCategory },
  { file: "twemoji-1f621.png", label: "Giận dữ", category: "emoji" as StickerCategory },
  { file: "twemoji-1f92f.png", label: "Nổ não", category: "emoji" as StickerCategory },
  { file: "twemoji-1f929.png", label: "Mắt ngôi sao", category: "emoji" as StickerCategory },
  { file: "twemoji-1f923.png", label: "Cười lăn", category: "emoji" as StickerCategory },
  { file: "twemoji-1f973.png", label: "Ăn mừng", category: "emoji" as StickerCategory },
  { file: "twemoji-1f970.png", label: "Yêu thương", category: "emoji" as StickerCategory },
  { file: "twemoji-1f97a.png", label: "Mắt cún con", category: "emoji" as StickerCategory },
  { file: "twemoji-1f60f.png", label: "Cười nhếch mép", category: "emoji" as StickerCategory },
  { file: "twemoji-1f644.png", label: "Đảo mắt", category: "emoji" as StickerCategory },
  { file: "twemoji-1f643.png", label: "Mặt ngược", category: "emoji" as StickerCategory },
  { file: "twemoji-1f913.png", label: "Mọt sách", category: "emoji" as StickerCategory },
  { file: "twemoji-1f920.png", label: "Cao bồi", category: "emoji" as StickerCategory },
  { file: "twemoji-1f921.png", label: "Chú hề", category: "emoji" as StickerCategory },
  { file: "twemoji-1f916.png", label: "Robot", category: "emoji" as StickerCategory },
  { file: "twemoji-1f917.png", label: "Ôm", category: "emoji" as StickerCategory },
  { file: "twemoji-1f44d.png", label: "Like", category: "emoji" as StickerCategory },
  { file: "twemoji-1f44e.png", label: "Dislike", category: "emoji" as StickerCategory },
  { file: "twemoji-1f44f.png", label: "Vỗ tay", category: "emoji" as StickerCategory },
  { file: "twemoji-1f64c.png", label: "Giơ tay ăn mừng", category: "emoji" as StickerCategory },
  { file: "twemoji-1f64f.png", label: "Chắp tay", category: "emoji" as StickerCategory },
  { file: "twemoji-1f91d.png", label: "Bắt tay", category: "emoji" as StickerCategory },
  { file: "twemoji-1f91e.png", label: "Cầu may", category: "emoji" as StickerCategory },
  { file: "twemoji-270c.png", label: "Chữ V chiến thắng", category: "emoji" as StickerCategory },
  { file: "twemoji-1f44c.png", label: "OK", category: "emoji" as StickerCategory },
  { file: "twemoji-1f44b.png", label: "Vẫy tay", category: "emoji" as StickerCategory },
  { file: "twemoji-270a.png", label: "Nắm đấm", category: "emoji" as StickerCategory },
  { file: "twemoji-1f918.png", label: "Rock on", category: "emoji" as StickerCategory },
  { file: "twemoji-2764.png", label: "Trái tim đỏ", category: "emoji" as StickerCategory },
  { file: "twemoji-1f495.png", label: "Hai trái tim", category: "emoji" as StickerCategory },
  { file: "twemoji-1f496.png", label: "Tim lấp lánh", category: "emoji" as StickerCategory },
  { file: "twemoji-1f498.png", label: "Tim mũi tên", category: "emoji" as StickerCategory },
  { file: "twemoji-1f499.png", label: "Tim xanh dương", category: "emoji" as StickerCategory },
  { file: "twemoji-1f49a.png", label: "Tim xanh lá", category: "emoji" as StickerCategory },
  { file: "twemoji-1f49b.png", label: "Tim vàng", category: "emoji" as StickerCategory },
  { file: "twemoji-1f49c.png", label: "Tim tím", category: "emoji" as StickerCategory },
  { file: "twemoji-1f49d.png", label: "Tim ruy băng", category: "emoji" as StickerCategory },
  { file: "twemoji-1f494.png", label: "Tim vỡ", category: "emoji" as StickerCategory },
  { file: "twemoji-1f9e1.png", label: "Tim cam", category: "emoji" as StickerCategory },
  { file: "twemoji-1f5a4.png", label: "Tim đen", category: "emoji" as StickerCategory },
  { file: "twemoji-1f389.png", label: "Pháo giấy", category: "emoji" as StickerCategory },
  { file: "twemoji-1f38a.png", label: "Tung hoa", category: "emoji" as StickerCategory },
  { file: "twemoji-1f382.png", label: "Bánh sinh nhật", category: "emoji" as StickerCategory },
  { file: "twemoji-1f381.png", label: "Quà tặng", category: "emoji" as StickerCategory },
  { file: "twemoji-1f388.png", label: "Bong bóng", category: "emoji" as StickerCategory },
  { file: "twemoji-2728.png", label: "Lấp lánh", category: "emoji" as StickerCategory },
  { file: "twemoji-1f31f.png", label: "Ngôi sao sáng", category: "emoji" as StickerCategory },
  { file: "twemoji-2b50.png", label: "Ngôi sao", category: "emoji" as StickerCategory },
  { file: "twemoji-1f3c6.png", label: "Cúp", category: "emoji" as StickerCategory },
  { file: "twemoji-1f947.png", label: "Huy chương vàng", category: "emoji" as StickerCategory },
  { file: "twemoji-1f3af.png", label: "Trúng đích", category: "emoji" as StickerCategory },
  { file: "twemoji-1f42d.png", label: "Chuột", category: "emoji" as StickerCategory },
  { file: "twemoji-1f439.png", label: "Chuột hamster", category: "emoji" as StickerCategory },
  { file: "twemoji-1f424.png", label: "Gà con", category: "emoji" as StickerCategory },
  { file: "twemoji-1f99d.png", label: "Gấu mèo", category: "emoji" as StickerCategory },
  { file: "twemoji-1f419.png", label: "Bạch tuộc", category: "emoji" as StickerCategory },
  { file: "twemoji-1f420.png", label: "Cá nhiệt đới", category: "emoji" as StickerCategory },
  { file: "twemoji-1f41d.png", label: "Ong", category: "emoji" as StickerCategory },
  { file: "twemoji-1f98b.png", label: "Bướm", category: "emoji" as StickerCategory },
  { file: "twemoji-1f32d.png", label: "Hotdog", category: "emoji" as StickerCategory },
  { file: "twemoji-1f35f.png", label: "Khoai tây chiên", category: "emoji" as StickerCategory },
  { file: "twemoji-1f368.png", label: "Kem ly", category: "emoji" as StickerCategory },
  { file: "twemoji-1f36c.png", label: "Kẹo", category: "emoji" as StickerCategory },
  { file: "twemoji-1f370.png", label: "Bánh ngọt", category: "emoji" as StickerCategory },
  { file: "twemoji-1f34e.png", label: "Táo đỏ", category: "emoji" as StickerCategory },
  { file: "twemoji-1f353.png", label: "Dâu tây", category: "emoji" as StickerCategory },
  { file: "twemoji-1f34d.png", label: "Dứa", category: "emoji" as StickerCategory },
  { file: "twemoji-1f4a4.png", label: "Buồn ngủ", category: "emoji" as StickerCategory },
  { file: "twemoji-1f4ab.png", label: "Chóng mặt", category: "emoji" as StickerCategory },
  { file: "twemoji-1f6a8.png", label: "Đèn cảnh sát", category: "emoji" as StickerCategory },
  { file: "twemoji-1f3b2.png", label: "Xúc xắc", category: "emoji" as StickerCategory },
  { file: "twemoji-1f3ac.png", label: "Clapperboard", category: "emoji" as StickerCategory },
  { file: "twemoji-1f3a4.png", label: "Micro", category: "emoji" as StickerCategory },
  { file: "twemoji-1f3a7.png", label: "Tai nghe", category: "emoji" as StickerCategory },
  { file: "twemoji-1f4f9.png", label: "Máy quay", category: "emoji" as StickerCategory },
  { file: "twemoji-1f4da.png", label: "Sách", category: "emoji" as StickerCategory },
  { file: "twemoji-1f393.png", label: "Mũ tốt nghiệp", category: "emoji" as StickerCategory },
  { file: "twemoji-26bd.png", label: "Bóng đá", category: "emoji" as StickerCategory },
  { file: "twemoji-1f3c0.png", label: "Bóng rổ", category: "emoji" as StickerCategory },
  { file: "twemoji-1f94a.png", label: "Găng boxing", category: "emoji" as StickerCategory },
  { file: "noto-1f436.png", label: "Chó", category: "emoji" as StickerCategory },
  { file: "noto-1f431.png", label: "Mèo", category: "emoji" as StickerCategory },
  { file: "noto-1f43c.png", label: "Gấu trúc", category: "emoji" as StickerCategory },
  { file: "noto-1f43b.png", label: "Gấu", category: "emoji" as StickerCategory },
  { file: "noto-1f98a.png", label: "Cáo", category: "emoji" as StickerCategory },
  { file: "noto-1f430.png", label: "Thỏ", category: "emoji" as StickerCategory },
  { file: "noto-1f428.png", label: "Gấu túi", category: "emoji" as StickerCategory },
  { file: "noto-1f427.png", label: "Chim cánh cụt", category: "emoji" as StickerCategory },
  { file: "noto-1f426.png", label: "Chim", category: "emoji" as StickerCategory },
  { file: "noto-1f438.png", label: "Ếch", category: "emoji" as StickerCategory },
  { file: "noto-1f981.png", label: "Sư tử", category: "emoji" as StickerCategory },
  { file: "noto-1f42f.png", label: "Hổ", category: "emoji" as StickerCategory },
  { file: "noto-1f984.png", label: "Kỳ lân", category: "emoji" as StickerCategory },
  { file: "noto-1f435.png", label: "Khỉ", category: "emoji" as StickerCategory },
  { file: "noto-1f43e.png", label: "Dấu chân", category: "emoji" as StickerCategory },
  { file: "noto-1f354.png", label: "Burger", category: "emoji" as StickerCategory },
  { file: "noto-1f355.png", label: "Pizza", category: "emoji" as StickerCategory },
  { file: "noto-1f366.png", label: "Kem", category: "emoji" as StickerCategory },
  { file: "noto-1f36a.png", label: "Bánh quy", category: "emoji" as StickerCategory },
  { file: "noto-1f36b.png", label: "Socola", category: "emoji" as StickerCategory },
  { file: "noto-1f36d.png", label: "Kẹo mút", category: "emoji" as StickerCategory },
  { file: "noto-1f37f.png", label: "Bỏng ngô", category: "emoji" as StickerCategory },
  { file: "noto-1f964.png", label: "Trà sữa", category: "emoji" as StickerCategory },
  { file: "noto-2615.png", label: "Cà phê", category: "emoji" as StickerCategory },
  { file: "noto-1f37a.png", label: "Bia", category: "emoji" as StickerCategory },
  { file: "noto-2600.png", label: "Mặt trời", category: "emoji" as StickerCategory },
  { file: "noto-1f319.png", label: "Mặt trăng", category: "emoji" as StickerCategory },
  { file: "noto-1f308.png", label: "Cầu vồng", category: "emoji" as StickerCategory },
  { file: "noto-2744.png", label: "Bông tuyết", category: "emoji" as StickerCategory },
  { file: "noto-1f525.png", label: "Lửa", category: "emoji" as StickerCategory },
  { file: "noto-1f30a.png", label: "Sóng biển", category: "emoji" as StickerCategory },
  { file: "noto-1f340.png", label: "Cỏ 4 lá", category: "emoji" as StickerCategory },
  { file: "noto-1f33b.png", label: "Hoa hướng dương", category: "emoji" as StickerCategory },
  { file: "noto-1f332.png", label: "Cây thông", category: "emoji" as StickerCategory },
  { file: "noto-2601.png", label: "Mây", category: "emoji" as StickerCategory },
  { file: "noto-1f4a1.png", label: "Bóng đèn", category: "emoji" as StickerCategory },
  { file: "noto-1f4af.png", label: "100 điểm", category: "emoji" as StickerCategory },
  { file: "noto-1f4a5.png", label: "Vụ nổ", category: "emoji" as StickerCategory },
  { file: "noto-1f4a9.png", label: "Phân", category: "emoji" as StickerCategory },
  { file: "noto-1f4ac.png", label: "Bong bóng chat", category: "emoji" as StickerCategory },
  { file: "noto-1f4ad.png", label: "Suy nghĩ", category: "emoji" as StickerCategory },
  { file: "noto-2753.png", label: "Dấu hỏi", category: "emoji" as StickerCategory },
  { file: "noto-2757.png", label: "Dấu chấm than", category: "emoji" as StickerCategory },
  { file: "noto-2705.png", label: "Tích xanh", category: "emoji" as StickerCategory },
  { file: "noto-274c.png", label: "Dấu X", category: "emoji" as StickerCategory },
  { file: "noto-1f6ab.png", label: "Cấm", category: "emoji" as StickerCategory },
  { file: "noto-26a0.png", label: "Cảnh báo", category: "emoji" as StickerCategory },
  { file: "noto-1f511.png", label: "Chìa khóa", category: "emoji" as StickerCategory },
  { file: "noto-1f4b0.png", label: "Túi tiền", category: "emoji" as StickerCategory },
  { file: "noto-1f3b5.png", label: "Nốt nhạc", category: "emoji" as StickerCategory },
  { file: "noto-1f3b6.png", label: "Nhạc", category: "emoji" as StickerCategory },
  { file: "noto-1f4a7.png", label: "Giọt nước", category: "emoji" as StickerCategory },
  { file: "noto-23f0.png", label: "Đồng hồ báo thức", category: "emoji" as StickerCategory },
  { file: "noto-1f50d.png", label: "Kính lúp", category: "emoji" as StickerCategory },
  { file: "noto-1f3a8.png", label: "Bảng màu", category: "emoji" as StickerCategory },
  { file: "noto-1f605.png", label: "Cười đổ mồ hôi", category: "emoji" as StickerCategory },
  { file: "noto-1f606.png", label: "Cười lớn", category: "emoji" as StickerCategory },
  { file: "noto-1f607.png", label: "Thiên thần", category: "emoji" as StickerCategory },
  { file: "noto-1f608.png", label: "Ác quỷ", category: "emoji" as StickerCategory },
  { file: "noto-1f60b.png", label: "Thèm ăn", category: "emoji" as StickerCategory },
  { file: "noto-1f60c.png", label: "Nhẹ nhõm", category: "emoji" as StickerCategory },
  { file: "noto-1f61b.png", label: "Lè lưỡi", category: "emoji" as StickerCategory },
  { file: "noto-1f61e.png", label: "Buồn", category: "emoji" as StickerCategory },
  { file: "noto-1f61f.png", label: "Lo lắng", category: "emoji" as StickerCategory },
  { file: "noto-1f620.png", label: "Bực mình", category: "emoji" as StickerCategory },
  { file: "noto-1f62a.png", label: "Buồn ngủ", category: "emoji" as StickerCategory },
  { file: "noto-1f62c.png", label: "Nhăn mặt", category: "emoji" as StickerCategory },
  { file: "noto-1f62e.png", label: "Ngạc nhiên", category: "emoji" as StickerCategory },
  { file: "noto-1f634.png", label: "Đang ngủ", category: "emoji" as StickerCategory },
  { file: "noto-1f635.png", label: "Chóng mặt", category: "emoji" as StickerCategory },
  { file: "noto-1f637.png", label: "Đeo khẩu trang", category: "emoji" as StickerCategory },
  { file: "noto-1f642.png", label: "Cười nhẹ", category: "emoji" as StickerCategory },
  { file: "noto-1f910.png", label: "Ngậm miệng", category: "emoji" as StickerCategory },
  { file: "noto-1f911.png", label: "Mắt tiền", category: "emoji" as StickerCategory },
  { file: "noto-1f914.png", label: "Suy nghĩ", category: "emoji" as StickerCategory },
  { file: "twemoji-1f63a.png", label: "Mèo cười", category: "emoji" as StickerCategory },
  { file: "twemoji-1f63b.png", label: "Mèo mắt tim", category: "emoji" as StickerCategory },
  { file: "noto-1f649.png", label: "Khỉ bịt tai", category: "emoji" as StickerCategory },
  { file: "noto-1f64a.png", label: "Khỉ bịt mắt", category: "emoji" as StickerCategory },

  // --- batch 4 (K6 Phase 6, Fluent UI Emoji 3D, MIT) ---
  { file: "fluent-red_heart.png", label: "Trái tim đỏ", category: "emoji" as StickerCategory },
  { file: "fluent-fire.png", label: "Lửa", category: "emoji" as StickerCategory },
  { file: "fluent-party_popper.png", label: "Pháo giấy", category: "emoji" as StickerCategory },
  { file: "fluent-rocket.png", label: "Tên lửa", category: "emoji" as StickerCategory },
  { file: "fluent-star.png", label: "Ngôi sao", category: "emoji" as StickerCategory },
  { file: "fluent-sparkles.png", label: "Lấp lánh", category: "emoji" as StickerCategory },
  { file: "fluent-crown.png", label: "Vương miện", category: "emoji" as StickerCategory },
  { file: "fluent-gem_stone.png", label: "Kim cương", category: "emoji" as StickerCategory },
  { file: "fluent-trophy.png", label: "Cúp vàng", category: "emoji" as StickerCategory },
  { file: "fluent-soccer_ball.png", label: "Bóng đá", category: "emoji" as StickerCategory },
  { file: "fluent-cat_face.png", label: "Mặt mèo", category: "emoji" as StickerCategory },
  { file: "fluent-dog_face.png", label: "Mặt chó", category: "emoji" as StickerCategory },
  { file: "fluent-pizza.png", label: "Pizza", category: "emoji" as StickerCategory },
  { file: "fluent-beer_mug.png", label: "Cốc bia", category: "emoji" as StickerCategory },
  { file: "fluent-musical_notes.png", label: "Nốt nhạc", category: "emoji" as StickerCategory },
  { file: "fluent-camera.png", label: "Máy ảnh", category: "emoji" as StickerCategory },
  { file: "fluent-video_camera.png", label: "Máy quay", category: "emoji" as StickerCategory },
  { file: "fluent-laptop.png", label: "Laptop", category: "emoji" as StickerCategory },
  { file: "fluent-mobile_phone.png", label: "Điện thoại", category: "emoji" as StickerCategory },
  { file: "fluent-light_bulb.png", label: "Bóng đèn", category: "emoji" as StickerCategory },
  { file: "fluent-money_bag.png", label: "Túi tiền", category: "emoji" as StickerCategory },
  { file: "fluent-balloon.png", label: "Bong bóng", category: "emoji" as StickerCategory },
  { file: "fluent-rainbow.png", label: "Cầu vồng", category: "emoji" as StickerCategory },
  { file: "fluent-sun.png", label: "Mặt trời", category: "emoji" as StickerCategory },
  { file: "fluent-snowflake.png", label: "Bông tuyết", category: "emoji" as StickerCategory },
  { file: "fluent-palm_tree.png", label: "Cây dừa", category: "emoji" as StickerCategory },
  { file: "fluent-rose.png", label: "Hoa hồng", category: "emoji" as StickerCategory },
  { file: "fluent-sunflower.png", label: "Hoa hướng dương", category: "emoji" as StickerCategory },
  { file: "fluent-grinning_face.png", label: "Mặt cười toe", category: "emoji" as StickerCategory },
  { file: "fluent-face_with_tears_of_joy.png", label: "Cười ra nước mắt", category: "emoji" as StickerCategory },
  { file: "fluent-winking_face.png", label: "Nháy mắt", category: "emoji" as StickerCategory },
  { file: "fluent-smiling_face_with_heart-eyes.png", label: "Mắt trái tim", category: "emoji" as StickerCategory },
  { file: "fluent-thinking_face.png", label: "Đang suy nghĩ", category: "emoji" as StickerCategory },
  { file: "fluent-sleeping_face.png", label: "Buồn ngủ", category: "emoji" as StickerCategory },
  { file: "fluent-angry_face.png", label: "Tức giận", category: "emoji" as StickerCategory },
  { file: "fluent-eyes.png", label: "Đôi mắt", category: "emoji" as StickerCategory },
  { file: "fluent-brain.png", label: "Bộ não", category: "emoji" as StickerCategory },
  { file: "fluent-hot_beverage.png", label: "Đồ uống nóng", category: "emoji" as StickerCategory },
  { file: "fluent-wrapped_gift.png", label: "Hộp quà", category: "emoji" as StickerCategory },
  { file: "fluent-crescent_moon.png", label: "Trăng lưỡi liềm", category: "emoji" as StickerCategory },
  { file: "fluent-full_moon.png", label: "Trăng tròn", category: "emoji" as StickerCategory },
] as const;

export type StickerLibraryFile = (typeof STICKER_LIBRARY)[number]["file"];

/** URL phục vụ sticker mẫu trong web app (Vite serve apps/web/public/). */
export function stickerUrl(file: string): string {
  return `/stickers/${file}`;
}

export function isStickerClip(c: unknown): c is StickerClip {
  return (
    typeof c === "object" &&
    c !== null &&
    (c as Record<string, unknown>)["kind"] === "sticker"
  );
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Chuẩn hoá sticker: điền giá trị mặc định cho các trường optional.
 * track giữ nguyên optional (quỹ đạo có thể không gắn) nên return type
 * trừ track khỏi Required — ép track thành bắt buộc sẽ nói dối type. */
export function normalizeStickerClip(c: StickerClip): Required<Omit<StickerClip, "track">> & Pick<StickerClip, "track"> {
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
    track: c.track,
  };
}

/**
 * Validate một sticker clip. Trả về mảng thông báo lỗi (rỗng = hợp lệ).
 * (Không kiểm tra file tồn tại — việc đó thuộc về validateMedia của render worker.)
 */
export function validateStickerClip(c: unknown): string[] {
  const errors: string[] = [];
  if (typeof c !== "object" || c === null) return ["sticker phải là một object"];
  const s = c as Record<string, unknown>;
  const where = `sticker "${String(s["id"] ?? "?")}"`;
  if (s["kind"] !== "sticker") errors.push(`${where}: kind phải là "sticker"`);
  if (typeof s["id"] !== "string" || (s["id"] as string).length === 0)
    errors.push(`${where}: thiếu id`);
  if (typeof s["src"] !== "string" || (s["src"] as string).length === 0)
    errors.push(`${where}: thiếu src (đường dẫn file PNG)`);
  if (!isFiniteNumber(s["start"]) || (s["start"] as number) < 0)
    errors.push(`${where}: start phải là số >= 0`);
  if (!isFiniteNumber(s["duration"]) || (s["duration"] as number) <= 0)
    errors.push(`${where}: duration phải là số > 0`);
  for (const key of ["x", "y"] as const) {
    const v = s[key];
    if (v !== undefined && (!isFiniteNumber(v) || v < 0 || v > 1))
      errors.push(`${where}: ${key} phải trong khoảng 0..1, nhận được: ${String(v)}`);
  }
  if (s["scale"] !== undefined && (!isFiniteNumber(s["scale"]) || (s["scale"] as number) <= 0))
    errors.push(`${where}: scale phải là số > 0, nhận được: ${String(s["scale"])}`);
  if (
    s["opacity"] !== undefined &&
    (!isFiniteNumber(s["opacity"]) || (s["opacity"] as number) < 0 || (s["opacity"] as number) > 1)
  )
    errors.push(`${where}: opacity phải trong khoảng 0..1, nhận được: ${String(s["opacity"])}`);
  if (s["rotation"] !== undefined && !isFiniteNumber(s["rotation"]))
    errors.push(`${where}: rotation phải là số (độ), nhận được: ${String(s["rotation"])}`);
  return errors;
}
