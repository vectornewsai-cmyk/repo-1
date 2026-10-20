/**
 * watermark — plugin mẫu: đóng dấu chữ mờ ở góc dưới-phải mọi clip video.
 *
 * Implement hook onClipRender: trả về filter drawtext mà registry sẽ nối
 * vào filter chain của clip trong render worker.
 *
 * Config (override khi load):
 * - text: nội dung watermark (mặc định "© VCut Studio")
 * - fontSize: cỡ chữ px (mặc định 28)
 * - opacity: 0..1 (mặc định 0.6)
 */

// Escape text cho drawtext: \ ' : và % (expansion của drawtext).
function escapeDrawtext(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%/g, "%%");
}

module.exports = {
  manifest: {
    name: "watermark",
    version: "1.0.0",
    author: "VCut Team",
    description: "Đóng dấu chữ mờ góc dưới-phải lên clip video/image.",
    apiVersion: 1,
    hooks: ["onClipRender"],
    permissions: ["filter:inject"],
    capabilities: [{ kind: "effect", id: "watermark", label: "Watermark chữ" }],
    defaultConfig: { text: "© VCut Studio", fontSize: 28, opacity: 0.6 },
  },
  hooks: {
    onClipRender: function (ctx) {
      // Chỉ áp cho video; image/sticker giữ nguyên.
      if (ctx.clipKind !== "video") return;
      var cfg = ctx.config || {};
      var text = typeof cfg.text === "string" && cfg.text ? cfg.text : "© VCut Studio";
      var fontSize = typeof cfg.fontSize === "number" && cfg.fontSize > 0 ? Math.round(cfg.fontSize) : 28;
      var opacity = typeof cfg.opacity === "number" ? Math.min(1, Math.max(0, cfg.opacity)) : 0.6;
      var filter =
        "drawtext=text='" + escapeDrawtext(text) + "'" +
        ":fontcolor=white@" + opacity.toFixed(2) +
        ":fontsize=" + fontSize +
        ":x=w-tw-16:y=h-th-16";
      return { filters: [filter] };
    },
  },
};
