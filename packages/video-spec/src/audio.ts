/**
 * audio.ts — Audio routing cho video-spec.
 *
 * Định nghĩa cách xử lý audio stream bên trong file video nguồn:
 * - "inherit": giữ tiếng gốc của video (mặc định) — render sẽ trích audio
 *   từ video source, áp cùng trim/speed/reverse rồi mix vào output.
 * - "mute": bỏ qua audio của video (video câm).
 * - "detach": (chưa hỗ trợ) tách audio thành clip riêng để chỉnh độc lập.
 */

export const SOURCE_AUDIO_MODES = ["inherit", "mute", "detach"] as const;

/** Cách xử lý audio trong file video nguồn. */
export type SourceAudioMode = (typeof SOURCE_AUDIO_MODES)[number];

/** Mặc định: giữ tiếng gốc. */
export const DEFAULT_SOURCE_AUDIO_MODE: SourceAudioMode = "inherit";

export function isSourceAudioMode(v: unknown): v is SourceAudioMode {
  return typeof v === "string" && (SOURCE_AUDIO_MODES as readonly string[]).includes(v);
}

/**
 * Validate sourceAudioMode. Trả về danh sách lỗi (rỗng = hợp lệ).
 * "detach" hợp lệ về mặt schema nhưng render worker hiện chưa hỗ trợ
 * (sẽ báo lỗi rõ ràng ở tầng render, không im lặng bỏ qua).
 */
export function validateSourceAudioMode(v: unknown): string[] {
  if (v === undefined) return [];
  if (!isSourceAudioMode(v)) {
    return [
      `sourceAudioMode phải là một trong ${SOURCE_AUDIO_MODES.map((m) => `"${m}"`).join(" | ")}, ` +
      `nhận được: ${JSON.stringify(v)}`,
    ];
  }
  return [];
}
