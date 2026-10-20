import { validatePluginFilters } from "./validate.js";
import { invokeHook, loadPluginFromSource } from "./sandbox.js";
/** Registry quản lý plugin đã nạp. */
export class PluginRegistry {
    plugins = new Map();
    /** Nạp plugin từ source JS. Ném PluginError nếu tên trùng hoặc manifest sai. */
    load(source, opts = {}) {
        const plugin = loadPluginFromSource(source, opts);
        if (this.plugins.has(plugin.manifest.name))
            throw new Error(`[plugin-api] plugin "${plugin.manifest.name}" đã được nạp`);
        this.plugins.set(plugin.manifest.name, plugin);
        return plugin.manifest;
    }
    /** Gỡ plugin khỏi registry. */
    unload(name) {
        return this.plugins.delete(name);
    }
    /** Danh sách manifest plugin đang nạp. */
    list() {
        return [...this.plugins.values()].map((p) => p.manifest);
    }
    /** Kiểm tra plugin có đang nạp không. */
    has(name) {
        return this.plugins.has(name);
    }
    /** Capability registry: mọi capability của mọi plugin, kèm tên plugin. */
    listCapabilities() {
        const out = [];
        for (const p of this.plugins.values())
            for (const cap of p.manifest.capabilities ?? [])
                out.push({ ...cap, plugin: p.manifest.name });
        return out;
    }
    /**
     * Chạy chuỗi onClipRender cho 1 clip. Trả về filters hợp lệ đã gom
     * (theo thứ tự nạp plugin) + lỗi của từng plugin nếu có.
     */
    runClipRender(base) {
        const filters = [];
        const hookErrors = {};
        for (const p of this.plugins.values()) {
            if (!p.implementedHooks.includes("onClipRender"))
                continue;
            try {
                const res = invokeHook(p, "onClipRender", { ...base, config: p.config });
                if (res?.filters)
                    filters.push(...validatePluginFilters(res.filters));
            }
            catch (e) {
                hookErrors[p.manifest.name] = errMsg(e);
            }
        }
        return { filters, hookErrors };
    }
    /** Chạy chuỗi onProjectValidate, gom errors/warnings. */
    runProjectValidate(spec) {
        const errors = [];
        const warnings = [];
        const hookErrors = {};
        for (const p of this.plugins.values()) {
            if (!p.implementedHooks.includes("onProjectValidate"))
                continue;
            try {
                const res = invokeHook(p, "onProjectValidate", { spec });
                for (const s of res?.errors ?? [])
                    errors.push(`[${p.manifest.name}] ${String(s)}`);
                for (const s of res?.warnings ?? [])
                    warnings.push(`[${p.manifest.name}] ${String(s)}`);
            }
            catch (e) {
                hookErrors[p.manifest.name] = errMsg(e);
            }
        }
        return { errors, warnings, hookErrors };
    }
    /** Phát sự kiện onExportStart tới mọi plugin quan tâm. */
    runExportStart(ctxData) {
        return this.broadcast("onExportStart", ctxData);
    }
    /** Chạy onExportFinish, gom warnings plugin thêm. */
    runExportFinish(ctxData) {
        const warnings = [];
        const hookErrors = {};
        for (const p of this.plugins.values()) {
            if (!p.implementedHooks.includes("onExportFinish"))
                continue;
            try {
                const res = invokeHook(p, "onExportFinish", { ...ctxData, config: p.config });
                for (const s of res?.warnings ?? [])
                    warnings.push(`[${p.manifest.name}] ${String(s)}`);
            }
            catch (e) {
                hookErrors[p.manifest.name] = errMsg(e);
            }
        }
        return { warnings, hookErrors };
    }
    /** Phát sự kiện timeline (action + payload tóm tắt) tới plugin quan sát. */
    emitTimelineAction(action, payload) {
        return this.broadcast("onTimelineAction", { action, payload });
    }
    /** Gọi hook kiểu quan sát: không lấy kết quả, chỉ thu lỗi. */
    broadcast(hookName, data) {
        const hookErrors = {};
        for (const p of this.plugins.values()) {
            if (!p.implementedHooks.includes(hookName))
                continue;
            const withConfig = hookName.startsWith("onExport") ? { ...data, config: p.config } : data;
            try {
                invokeHook(p, hookName, withConfig);
            }
            catch (e) {
                hookErrors[p.manifest.name] = errMsg(e);
            }
        }
        return { hookErrors };
    }
}
function errMsg(e) {
    return e instanceof Error ? e.message : String(e);
}
