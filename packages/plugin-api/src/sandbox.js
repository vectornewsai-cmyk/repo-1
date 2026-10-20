/**
 * sandbox.ts — nạp plugin JS vào sandbox Node `vm` với API giới hạn.
 *
 * Cách ly thực tế (KHÔNG chỉ bằng "quy ước"):
 * - Context riêng với chỉ các global được cấp: `module`, `exports`,
 *   `console` (log ra host), `vc` (PluginHostApi). KHÔNG có `require`,
 *   `process`, `fs`, `Buffer`, `fetch`, `setTimeout`.
 * - Tắt code generation trong context (`eval` / `new Function` trong plugin
 *   sẽ ném lỗi) — chặn đường thoát sandbox phổ biến qua Function constructor.
 * - Mọi lần chạy (load + gọi hook) đều có timeout cứng của vm — plugin treo
 *   vòng lặp vô hạn bị cắt sau timeout.
 * - Context truyền qua biên đều là JSON (deep clone): plugin không cầm được
 *   tham chiếu object của host.
 *
 * GIỚI HẠN TRUNG THỰC: Node docs nói rõ `vm` KHÔNG phải security mechanism
 * tuyệt đối trước attacker quyết tâm (prototype pollution qua object lạ...).
 * Biện pháp ở đây ngăn truy cập API host và các escape thường gặp; xem thêm
 * PLUGIN_API_LIMITS.md. Chỉ load plugin từ nguồn tin cậy.
 */
import { createContext, runInContext } from "node:vm";
import { PluginError } from "./types.js";
import { validateManifest } from "./validate.js";
/**
 * Nạp plugin từ source JS (nội dung file plugin.js).
 * Source phải gán `module.exports = { manifest, hooks }`.
 */
export function loadPluginFromSource(source, opts = {}) {
    if (typeof source !== "string" || source.trim().length === 0)
        throw new PluginError("nguồn plugin rỗng");
    const loadTimeout = opts.loadTimeoutMs ?? 2000;
    const logger = opts.logger ?? ((name, msg) => console.error(`[plugin:${name}] ${msg}`));
    // Global tối thiểu cho context.
    const moduleObj = { exports: {} };
    let pluginName = "<unknown>";
    const log = (message) => logger(pluginName, String(message));
    const sandbox = {
        module: moduleObj,
        exports: moduleObj.exports,
        console: Object.freeze({
            log,
            info: log,
            warn: (m) => logger(pluginName, `warn: ${String(m)}`),
            error: (m) => logger(pluginName, `error: ${String(m)}`),
        }),
        vc: Object.freeze({ log, apiVersion: 1 }),
    };
    const ctx = createContext(sandbox, {
        name: "vcut-plugin",
        codeGeneration: { strings: false, wasm: false },
    });
    try {
        runInContext(source, ctx, { timeout: loadTimeout, filename: "plugin.js" });
    }
    catch (e) {
        throw new PluginError(`nạp plugin thất bại: ${errMsg(e)}`);
    }
    const mod = moduleObj.exports;
    if (!mod || typeof mod !== "object")
        throw new PluginError("plugin phải gán module.exports = { manifest, hooks }");
    if (!mod.hooks || typeof mod.hooks !== "object")
        throw new PluginError("plugin thiếu object hooks");
    const manifest = validateManifest(mod.manifest);
    pluginName = manifest.name;
    const implemented = [];
    for (const name of manifest.hooks) {
        const fn = mod.hooks[name];
        if (typeof fn !== "function")
            throw new PluginError(`manifest khai hook "${name}" nhưng hooks.${name} không phải function`);
        implemented.push(name);
    }
    // Đưa module vào trong context để invokeHook gọi qua runInContext (có timeout).
    sandbox["__plugin"] = mod;
    const config = {
        ...(manifest.defaultConfig ?? {}),
        ...(opts.config ?? {}),
    };
    return { manifest, config, implementedHooks: implemented, _ctx: ctx, _log: log };
}
/**
 * Gọi 1 hook của plugin bên trong sandbox (timeout cứng).
 * ctx được JSON-clone vào trong; kết quả JSON-clone ra ngoài.
 * Trả về undefined nếu hook trả undefined/không tồn tại.
 */
export function invokeHook(plugin, hookName, ctxData, timeoutMs = 1000) {
    const ctx = plugin._ctx;
    // Truyền tham số qua global của context — tránh nối chuỗi vào code.
    const sandbox = ctx;
    sandbox["__hookName"] = hookName;
    sandbox["__hookArgJson"] = JSON.stringify(ctxData);
    const script = `(function () {
    var hook = __plugin.hooks[__hookName];
    if (typeof hook !== "function") return null;
    var arg = JSON.parse(__hookArgJson);
    var res = hook(arg);
    if (res && typeof res.then === "function") throw new Error("hook phai dong bo (khong tra Promise)");
    return res === undefined ? null : JSON.stringify(res);
  })()`;
    let raw;
    try {
        raw = runInContext(script, ctx, { timeout: timeoutMs });
    }
    catch (e) {
        throw new PluginError(`hook "${hookName}" của plugin "${plugin.manifest.name}" lỗi/timeout: ${errMsg(e)}`);
    }
    finally {
        delete sandbox["__hookName"];
        delete sandbox["__hookArgJson"];
    }
    if (raw === null || raw === undefined)
        return undefined;
    return JSON.parse(raw);
}
function errMsg(e) {
    return e instanceof Error ? e.message : String(e);
}
