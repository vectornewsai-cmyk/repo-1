/**
 * ttsDuration44Z3.ts — Hậu tố giây cho toast done của TtsButton
 * (Phase 9 đợt 44, luồng Z3 — đóng nợ đợt 43 Y3 §6).
 *
 * Vấn đề: toast done của TtsButton chỉ kèm "(…s)" khi bridge trả header
 * `X-TTS-Duration` đọc được; đợt 43 Y3 ghi nhận lần chạy đó header trống
 * (dur = 0) nên toast mất hậu tố. Nguyên nhân gốc (xác minh đợt 44 Z3,
 * xem docs/PHASE9_ROUND44_Z3_RELINK_LIMITS.md §4): bridge CÓ gửi header
 * này, nhưng CORS toàn cục của bridge chỉ expose `Accept-Ranges` /
 * `Content-Range` nên trình duyệt (vite :5173 → bridge :8787, khác
 * origin) lọc `X-TTS-*` khỏi `fetch` — `headers.get()` trả null dù
 * bridge đã gửi. Sửa gốc nằm ở bridge (expose thêm `X-TTS-*`, origin
 * vẫn chỉ loopback). File này là fallback ở client cho trường hợp header
 * vẫn không đọc được (bridge cũ, proxy lột header): KHÔNG bỏ hậu tố một
 * cách im lặng, mà ước lượng và ghi rõ là ước lượng bằng tiền tố "≈".
 *
 * Quyết định (Z3, ghi trong LIMITS §4): khi header thiếu/không hợp lệ
 * thì ước lượng từ độ dài text, KHÔNG bỏ hậu tố. Lý do: toast done là
 * nơi duy nhất user thấy độ dài giọng đọc vừa tạo; bỏ hậu tố thì mọi
 * trường hợp fallback đều mất thông tin, trong khi ước lượng có ghi "≈"
 * vẫn hữu ích và không mạo nhận là số đo thật. Khi header đọc được thì
 * luôn dùng số thật, không ước lượng.
 *
 * Tốc độ hiệu chuẩn: TTS_VI_CHARS_PER_SEC đo thật trên bridge local
 * (giọng "Hải Đăng", VieNeu-TTS v3 Turbo) — xem LIMITS §4.3, bảng đo.
 * Ước lượng chỉ đúng bậc độ lớn: tốc độ đọc thật thay đổi theo dấu câu,
 * giọng và độ dài câu, nên kết quả luôn mang "≈" và làm tròn 1 số lẻ.
 * Không dùng hằng này cho việc gì khác ngoài hậu tố toast (không dùng
 * để cắt/ghép audio, không dùng để tính timeline).
 */

/**
 * Tốc độ đọc hiệu chuẩn cho tiếng Việt, giọng "Hải Đăng" (đợt 44 Z3):
 * tổng 370 ký tự / tổng 20,08 s = 18,4 ký tự/giây (3 mẫu đo thật qua
 * bridge, header X-TTS-Duration khớp ffprobe từng mẫu — xem LIMITS
 * §4.3). Sai số ước lượng trên chính 3 mẫu: mẫu ngắn 29 ký tự lệch
 * −24% (1,57 s ước lượng so với 2,08 s thật — câu ngắn có quãng nghỉ
 * tương đối lớn), 114 ký tự +4,5%, 227 ký tự +2,0%. Vì vậy ước lượng
 * chỉ đúng bậc độ lớn và luôn mang "≈"; không dùng cho tính toán nào
 * khác ngoài hậu tố toast.
 */
export const TTS_VI_CHARS_PER_SEC = 18.4; // ROUND44-Z3: đo thật, xem LIMITS §4.3

/** Đọc header `X-TTS-Duration`: số giây > 0 thì nhận, còn lại null. */
export function parseTtsDurationHeader(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Số ký tự đọc được (đếm theo code point, không đếm theo UTF-16 unit). */
export function ttsTextLength(text: string): number {
  return [...(text ?? "")].length;
}

/**
 * Ước lượng độ dài giọng đọc (giây) từ độ dài text và tốc độ ký tự/giây.
 * Trả null khi text rỗng hoặc tốc độ không hợp lệ — caller khi đó bỏ
 * hậu tố thay vì hiển thị số vô nghĩa.
 */
export function estimateTtsDurationSec(
  text: string,
  charsPerSec: number = TTS_VI_CHARS_PER_SEC,
): number | null {
  const len = ttsTextLength(text);
  if (len <= 0) return null;
  if (!Number.isFinite(charsPerSec) || charsPerSec <= 0) return null;
  return len / charsPerSec;
}

/**
 * Hậu tố cho key `tts.done` ("…{dur}…"):
 * - header hợp lệ → ` (12.3s)` (số đo thật, không có "≈");
 * - header thiếu/không hợp lệ, text có nội dung → ` (≈12.3s)` (ước lượng);
 * - không ước lượng được (text rỗng) → "" (bỏ hậu tố, không bịa số).
 */
export function ttsDoneSuffix(opts: {
  headerValue: string | null | undefined;
  text: string;
  charsPerSec?: number;
}): string {
  const measured = parseTtsDurationHeader(opts.headerValue);
  if (measured !== null) return ` (${measured.toFixed(1)}s)`;
  const est = estimateTtsDurationSec(opts.text, opts.charsPerSec);
  if (est === null) return "";
  return ` (≈${est.toFixed(1)}s)`;
}
