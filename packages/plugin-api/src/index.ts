/**
 * @repo-1/plugin-api — Plugin API và capability registry cho VCut Studio.
 *
 * Bên thứ ba viết plugin (1 file JS export { manifest, hooks }) để mở rộng
 * VCut: effect mới (chèn FFmpeg filter), validator mới, quan sát export/
 * timeline. Plugin chạy trong sandbox Node `vm` với API giới hạn.
 *
 * Xem hướng dẫn: ../../docs/PLUGINS.md
 */
export * from "./types.js";
export * from "./validate.js";
export { loadPluginFromSource, invokeHook, type LoadedPlugin, type LoadPluginOptions } from "./sandbox.js";
export { PluginRegistry } from "./registry.js";
