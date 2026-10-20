/**
 * types.ts — Plugin API và capability registry cho VCut Studio (R1-105).
 *
 * Plugin là 1 file JS duy nhất export `{ manifest, hooks }`. File chạy trong
 * sandbox Node `vm` với API giới hạn (xem sandbox.ts) — plugin KHÔNG được
 * truy cập fs/process/network/require.
 *
 * Hooks (khai báo trong manifest.hooks):
 * - "onClipRender"     — chèn thêm FFmpeg filter vào 1 clip (effect mới).
 * - "onExportStart"    — quan sát/chú thích trước khi export.
 * - "onExportFinish"   — quan sát sau khi export xong (có thể thêm warnings).
 * - "onTimelineAction" — quan sát action trên timeline (undo/redo/split...).
 * - "onProjectValidate"— thêm lỗi/cảnh báo khi validate project.
 *
 * Mọi dữ liệu trao đổi qua biên sandbox đều là JSON thuần (deep-clone),
 * tránh leak object host vào plugin.
 */
/** Lỗi plugin (manifest sai, sandbox chặn, hook timeout...). */
export class PluginError extends Error {
    constructor(message) {
        super(`[plugin-api] ${message}`);
        this.name = "PluginError";
    }
}
