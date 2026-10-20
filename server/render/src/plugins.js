/**
 * plugins.js — Nối PluginRegistry (@repo-1/plugin-api) vào render worker.
 *
 * Chỉ kích hoạt khi spec có trường `plugins` (xem PluginRef trong
 * packages/video-spec). Spec không khai plugin → module này không được gọi,
 * plugin-api không hề được require → hành vi render cũ 100%.
 *
 * Cách resolve plugin (mỗi entry khai đúng MỘT trong hai):
 * - `id`:   plugins/<id>/plugin.js trong repo (plugin đóng gói sẵn).
 *           validate.js đã chặn id chứa ký tự đường dẫn (chống traversal).
 * - `path`: file plugin.js — tuyệt đối, hoặc tương đối so với thư mục
 *           chứa file spec.
 *
 * Nguyên tắc trung thực: spec đã khai plugin mà nạp THẤT BẠI (thiếu file,
 * manifest sai, trùng tên...) thì render FAIL — không lặng lẽ bỏ qua rồi
 * giao video thiếu hiệu ứng user đã yêu cầu. Ngược lại, lỗi trong HOOK của
 * plugin (timeout, exception) không làm sập render: registry gom vào
 * hookErrors, host ghi ra stderr (bridge gom stderr vào job log).
 */
"use strict";

const fs = require("fs");
const path = require("path");

/** Gốc repo: server/render/src → ../../.. */
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

/**
 * Nạp plugin-api (ESM) — Node >= 22 require() được ESM không top-level await.
 * Trỏ thẳng vào src/index.js (entry của "exports" trong package.json của
 * plugin-api): require() theo thư mục không resolve được exports của ESM.
 */
function loadPluginApi() {
  try {
    return require(path.join(REPO_ROOT, "packages", "plugin-api", "src", "index.js"));
  } catch (e) {
    throw new Error(`không nạp được @repo-1/plugin-api: ${e.message}`);
  }
}

/** Entry spec → đường dẫn file plugin.js tuyệt đối. */
function resolvePluginFile(entry, specDir) {
  if (entry.id) return path.join(REPO_ROOT, "plugins", entry.id, "plugin.js");
  return path.isAbsolute(entry.path)
    ? entry.path
    : path.resolve(specDir, entry.path);
}

/**
 * Tạo plugin host từ spec.plugins.
 * @param {object} spec    VideoSpec đã qua validateSpec.
 * @param {string} specDir Thư mục chứa file spec (gốc resolve `path` tương đối).
 * @returns {null | object} null nếu spec không khai plugin nào.
 * @throws {Error} nếu nạp bất kỳ plugin nào thất bại.
 */
function createPluginHost(spec, specDir) {
  const entries = Array.isArray(spec.plugins) ? spec.plugins : [];
  if (entries.length === 0) return null;

  const { PluginRegistry } = loadPluginApi();
  const registry = new PluginRegistry();
  const loaded = [];

  for (const entry of entries) {
    const label = entry.id || entry.path;
    const file = resolvePluginFile(entry, specDir);
    let source;
    try {
      source = fs.readFileSync(file, "utf8");
    } catch {
      throw new Error(`plugin "${label}": không đọc được file ${file}`);
    }
    let manifest;
    try {
      manifest = registry.load(source, { config: entry.config ?? {} });
    } catch (e) {
      throw new Error(`plugin "${label}" (${file}): ${e.message}`);
    }
    loaded.push({ name: manifest.name, file });
  }

  const host = {
    registry,
    /** [{ name, file }] — plugin đã nạp thành công, theo thứ tự spec. */
    loaded,
    /** Lỗi hook gom từ mọi lần chạy hook (tên plugin -> message). */
    hookErrors: {},
    _filterCache: new Map(),

    _merge(rep) {
      if (rep && rep.hookErrors) Object.assign(this.hookErrors, rep.hookErrors);
    },

    /** onProjectValidate: gom errors/warnings plugin cho spec hiện tại. */
    validateProject(specJson) {
      const rep = registry.runProjectValidate(specJson);
      this._merge(rep);
      return rep;
    },

    /**
     * Filters onClipRender cho 1 video clip (cache theo clip.id — mỗi clip
     * chỉ chạy hook 1 lần dù buildFilterGraph duyệt lại).
     */
    filtersForClip(clip, project) {
      if (this._filterCache.has(clip.id)) return this._filterCache.get(clip.id);
      const rep = registry.runClipRender({ clip, clipKind: "video", project });
      this._merge(rep);
      this._filterCache.set(clip.id, rep.filters);
      return rep.filters;
    },

    /** onExportStart (quan sát). Trả report để caller log hookErrors mới. */
    exportStart(ctxData) {
      const rep = registry.runExportStart(ctxData);
      this._merge(rep);
      return rep;
    },

    /** onExportFinish: trả report (warnings + hookErrors) để caller log. */
    exportFinish(ctxData) {
      const rep = registry.runExportFinish(ctxData);
      this._merge(rep);
      return rep;
    },
  };
  return host;
}

module.exports = { createPluginHost, resolvePluginFile, REPO_ROOT };
