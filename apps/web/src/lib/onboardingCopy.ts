/**
 * onboardingCopy.ts — chuỗi riêng cho Onboarding / Tour / Template Pack (R1, Phase 9).
 *
 * CỐ TÌNH không dùng i18n/vi.json và i18n/en.json: một agent Phase 9 khác đang
 * làm i18n, tránh xung đột file. Khi agent đó xong, gộp các key dưới đây vào
 * vi.json/en.json rồi đổi `ot()` sang `t()` — cấu trúc key đã đặt theo cùng
 * quy ước (nhóm.tên), việc gộp chỉ là copy-paste.
 *
 * Ngôn ngữ lấy từ i18n/index (getLang) nên vẫn đổi theo nút đổi ngôn ngữ.
 */
import { getLang } from "../i18n";

type Dict = Record<string, string>;

const VI: Dict = {
  // ---- Welcome ----
  "welcome.title": "👋 Chào mừng tới VCut Studio",
  "welcome.lead":
    "Trình dựng video chạy 100% trên máy của bạn: không tải video lên server, không cần tài khoản, không phí AI.",
  "welcome.step1Title": "1 · Mở là có video xem ngay",
  "welcome.step1Body":
    "Project mẫu đã nạp sẵn: bấm ▶ là phát, kéo thả clip trên timeline để thử cắt, kéo, tách.",
  "welcome.step2Title": "2 · Tạo video từ template 1 chạm",
  "welcome.step2Body":
    "Chọn 1 pack mẫu — media, chữ và caption mẫu tự sinh ngay trên máy, không cần chuẩn bị file gì.",
  "welcome.step3Title": "3 · Xuất MP4 khi ưng ý",
  "welcome.step3Body":
    "Nút Xuất bản ở góc phải TopBar: render bằng FFmpeg local, file về máy bạn.",
  "welcome.sample": "▶ Xem project mẫu",
  "welcome.pack": "⚡ Tạo video 1 chạm",
  "welcome.tour": "🧭 Xem tour 5 bước",
  "welcome.blank": "＋ Project trống",
  "welcome.later": "Để sau",
  "welcome.reopen": "Mở lại màn này bằng nút “👋 Bắt đầu” trên TopBar.",
  // ---- Tour ----
  "tour.title": "🧭 Tour 5 bước",
  "tour.prev": "← Trước",
  "tour.next": "Tiếp →",
  "tour.skip": "Bỏ qua",
  "tour.done": "Xong, bắt đầu làm!",
  "tour.step1Title": "Bước 1 — Thêm media",
  "tour.step1Body":
    "Kéo thả file video/ảnh/nhạc vào Thư viện media (panel trái), hoặc bấm nút thêm file trong đó. Media chỉ nằm trên máy bạn.",
  "tour.step2Title": "Bước 2 — Cắt clip",
  "tour.step2Body":
    "Trên timeline: bấm chọn clip, kéo mép clip để trim, bấm phím S tại vị trí playhead để tách clip làm đôi.",
  "tour.step3Title": "Bước 3 — Thêm chữ",
  "tour.step3Body":
    "Bấm nút “＋ Chữ” trên TopBar để thêm clip chữ tại playhead, rồi sửa nội dung, cỡ chữ, màu sắc ở panel Thuộc tính.",
  "tour.step4Title": "Bước 4 — Hiệu ứng & màu",
  "tour.step4Body":
    "Chọn 1 clip rồi mở panel Thuộc tính: hiệu ứng video, LUT màu, mask, keyframe đều nằm ở đó.",
  "tour.step5Title": "Bước 5 — Xuất video",
  "tour.step5Body":
    "Bấm nút “Xuất bản” trên TopBar, chọn preset rồi bấm Xuất: FFmpeg local render ra file MP4 về máy bạn.",
  "tour.targetMissing": "Không tìm thấy khu vực này trên màn hình (có thể panel đang đóng) — cứ đọc hướng dẫn rồi bấm Tiếp.",
  // ---- Pack ----
  "pack.title": "⚡ Template pack 1 chạm",
  "pack.lead":
    "Chọn 1 pack: media mẫu tự sinh ngay trên máy bạn, chữ và caption lấy đúng mẫu của template. Bấm “Tạo ngay” là có project xem được liền, không cần chuẩn bị file.",
  "pack.create": "Tạo ngay",
  "pack.creating": "Đang tạo media mẫu, chờ vài giây...",
  "pack.created": "Đã tạo project từ pack!",
  "pack.clips": "clip",
  "pack.watch": "▶ Xem ngay",
  "pack.again": "🔁 Tạo pack khác",
  "pack.tts": "🎙 Tạo giọng đọc mẫu",
  "pack.ttsBusy": "Đang tạo giọng đọc...",
  "pack.ttsHint":
    "Giọng đọc tạo bằng VieNeu-TTS chạy local qua bridge (127.0.0.1:8787). Nếu bridge chưa chạy, nút này sẽ báo lỗi rõ — không có audio giả.",
  "pack.back": "← Quay lại danh sách",
  "pack.close": "Đóng",
  "pack.mediaNote": "Media mẫu do VCut tự vẽ bằng Canvas ngay trên máy bạn (không dùng ảnh/video ngoài, license sạch 100%).",
  "pack.noVideoRecorder":
    "Trình duyệt này không ghi được video mẫu (thiếu MediaRecorder). Hãy dùng Chrome/Edge bản mới, hoặc chọn pack chỉ có ảnh (Thẻ tiêu đề, Bìa album).",
};

const EN: Dict = {
  "welcome.title": "👋 Welcome to VCut Studio",
  "welcome.lead":
    "A video editor that runs 100% on your machine: no uploads, no account, no AI fees.",
  "welcome.step1Title": "1 · A video is ready on open",
  "welcome.step1Body":
    "A sample project is preloaded: press ▶ to play, drag clips on the timeline to try cutting and splitting.",
  "welcome.step2Title": "2 · One-click video from a template",
  "welcome.step2Body":
    "Pick a sample pack — media, text and sample captions are generated on your machine, no files to prepare.",
  "welcome.step3Title": "3 · Export MP4 when you like it",
  "welcome.step3Body":
    "The Publish button at the top-right renders with local FFmpeg, straight to your machine.",
  "welcome.sample": "▶ View sample project",
  "welcome.pack": "⚡ One-click video",
  "welcome.tour": "🧭 Take the 5-step tour",
  "welcome.blank": "＋ Blank project",
  "welcome.later": "Later",
  "welcome.reopen": "Reopen this screen with the “👋 Start” button on the TopBar.",
  "tour.title": "🧭 5-step tour",
  "tour.prev": "← Back",
  "tour.next": "Next →",
  "tour.skip": "Skip",
  "tour.done": "Done, let's edit!",
  "tour.step1Title": "Step 1 — Add media",
  "tour.step1Body":
    "Drag video/image/audio files into the Media library (left panel), or use its add-file button. Media stays on your machine.",
  "tour.step2Title": "Step 2 — Cut clips",
  "tour.step2Body":
    "On the timeline: click a clip, drag its edges to trim, press S at the playhead to split it in two.",
  "tour.step3Title": "Step 3 — Add text",
  "tour.step3Body":
    "Click “＋ Text” on the TopBar to add a text clip at the playhead, then edit content, size and color in the Properties panel.",
  "tour.step4Title": "Step 4 — Effects & color",
  "tour.step4Body":
    "Select a clip and open the Properties panel: video effects, color LUTs, masks and keyframes live there.",
  "tour.step5Title": "Step 5 — Export video",
  "tour.step5Body":
    "Click “Publish” on the TopBar, pick a preset and export: local FFmpeg renders an MP4 to your machine.",
  "tour.targetMissing": "That area was not found on screen (its panel may be closed) — read the guide and click Next.",
  "pack.title": "⚡ One-click template pack",
  "pack.lead":
    "Pick a pack: sample media is generated on your machine, text and captions come from the template itself. Click “Create now” and you get a watchable project instantly, no files to prepare.",
  "pack.create": "Create now",
  "pack.creating": "Generating sample media, please wait a few seconds...",
  "pack.created": "Project created from pack!",
  "pack.clips": "clips",
  "pack.watch": "▶ Watch now",
  "pack.again": "🔁 Create another pack",
  "pack.tts": "🎙 Generate sample voiceover",
  "pack.ttsBusy": "Generating voiceover...",
  "pack.ttsHint":
    "Voiceover is made by local VieNeu-TTS through the bridge (127.0.0.1:8787). If the bridge is not running, this button reports a clear error — no fake audio.",
  "pack.back": "← Back to list",
  "pack.close": "Close",
  "pack.mediaNote": "Sample media is drawn by VCut itself with Canvas on your machine (no outside images/videos, 100% clean license).",
  "pack.noVideoRecorder":
    "This browser cannot record sample video (no MediaRecorder). Use a recent Chrome/Edge, or pick an image-only pack (Title card, Album cover).",
};

/** Lấy chuỗi onboarding theo ngôn ngữ hiện tại, fallback vi → key. */
export function ot(key: string): string {
  const lang = getLang();
  const dict = lang === "en" ? EN : VI;
  return dict[key] ?? VI[key] ?? key;
}
