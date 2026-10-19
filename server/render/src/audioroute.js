/**
 * audioroute.js — Audio routing cho render worker (Node, zero-deps).
 *
 * Mirror của `packages/video-spec/src/audio.ts`.
 * Định nghĩa cách xử lý audio stream bên trong file video nguồn.
 */
"use strict";

const SOURCE_AUDIO_MODES = ["inherit", "mute", "detach"];

const DEFAULT_SOURCE_AUDIO_MODE = "inherit";

function isSourceAudioMode(v) {
  return typeof v === "string" && SOURCE_AUDIO_MODES.includes(v);
}

/** Validate sourceAudioMode, trả về danh sách lỗi (rỗng = hợp lệ). */
function validateSourceAudioMode(v) {
  if (v === undefined) return [];
  if (!isSourceAudioMode(v)) {
    return [
      `sourceAudioMode phải là một trong ${SOURCE_AUDIO_MODES.map((m) => `"${m}"`).join(" | ")}, ` +
      `nhận được: ${JSON.stringify(v)}`,
    ];
  }
  return [];
}

module.exports = {
  SOURCE_AUDIO_MODES,
  DEFAULT_SOURCE_AUDIO_MODE,
  isSourceAudioMode,
  validateSourceAudioMode,
};
