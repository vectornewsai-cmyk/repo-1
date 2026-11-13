/**
 * sampleMime.ts — Phase 9 đợt 73, luồng A7 (audit Safari).
 *
 * Vấn đề: sampleMedia.ts / sample.ts ghi media mẫu bằng MediaRecorder
 * với danh sách mime CHỈ có webm (`video/webm;codecs=vp9/vp8`, webm).
 * Trên Safari, `isTypeSupported("video/webm...")` trả false hết →
 * `new MediaRecorder(stream)` dùng mime mặc định của Safari là
 * `video/mp4` — nhưng code cũ vẫn đóng Blob/File với
 * `{ type: "video/webm" }` hard-code: file MP4 bị gán nhãn webm.
 * Blob URL mang type sai thì `<video>` trên Safari không phát được
 * (nó tin type của blob), nên media mẫu của template pack / project
 * mẫu có thể không phát được trên Safari thật — trong khi trên Chromium
 * mime đã là webm nên không lộ.
 *
 * `recorderContainerType(rec.mimeType)` lấy đúng container mà recorder
 * thật sự dùng (phần trước `;` của `rec.mimeType`): Chromium vẫn ra
 * `video/webm` (hành vi không đổi), Safari ra `video/mp4` (nhãn đúng).
 * Chỉ sửa nhãn MIME của Blob/File — tên file `.webm` do caller đặt
 * (templatePack.ts / sample.ts) vẫn giữ nguyên, ghi rõ ở LIMITS A7 §4.
 *
 * Kiểm chứng: apps/web/src/lib/sampleMime73A7.test.ts (hàm thuần).
 */

/**
 * Container MIME (không tham số codec) của media mà MediaRecorder thật
 * sự ghi — lấy từ `rec.mimeType`. Trả về `video/webm` khi không đọc
 * được mime hợp lệ (giữ đúng hành vi cũ trên Chromium).
 */
export function recorderContainerType(mimeType: string | undefined | null): string {
  if (typeof mimeType === "string") {
    const container = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
    // Cần có subtype thật sau "video/" / "audio/" — "video/" trơ trọi không hợp lệ.
    if (
      (container.startsWith("video/") && container.length > "video/".length) ||
      (container.startsWith("audio/") && container.length > "audio/".length)
    ) {
      return container;
    }
  }
  return "video/webm";
}

/**
 * Đuôi file khớp với container thật (đợt 74 B3 — đóng nợ A7 §4.1/§5.2:
 * tên file mẫu vẫn `.webm` dù bytes có thể là MP4 trên Safari).
 * `video/mp4` → "mp4", còn lại (webm / không đọc được) → "webm" — giữ
 * đúng tên cũ trên Chromium, chỉ đổi tên trên trình duyệt ghi mp4.
 * Caller dùng đuôi này ĐẶT TÊN lúc tạo file, để tên khớp bytes và
 * `<video>`/rehydrate không bị lừa bởi đuôi sai.
 */
export function extensionForContainer(mimeType: string | undefined | null): "mp4" | "webm" {
  return recorderContainerType(mimeType) === "video/mp4" ? "mp4" : "webm";
}
