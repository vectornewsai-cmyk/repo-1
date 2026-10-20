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
import { createContext, runInContext, type Context } from "node:vm";
import { PluginError, type PluginManifest, type PluginModule } from "./types.js";
import { validateManifest } from "./validate.js";

/** Plugin đã nạp — chỉ host cầm, plugin không thấy. */
export interface LoadedPlugin {
  manifest: PluginManifest;
  /** Config hiệu lực (defaultConfig gộp với override lúc load). */
  config: Record<string, unknown>;
  /** Hook plugin thực sự implement (đã đối chiếu manifest). */
  implementedHooks: string[];
  /** Context vm nội bộ — registry dùng để gọi hook qua invokeHook. */
  _ctx: Context;
  /** Logger nội bộ. */
  _log: (msg: string) => void;
}

export interface LoadPluginOptions {
  /** Override config (gộp lên defaultConfig). */
  config?: Record<string, unknown>;
  /** Timeout nạp plugin (ms). Mặc định 2000. */
  loadTimeoutMs?: number;
  /** Logger host nhận log từ plugin. Mặc định: console.error có prefix. */
  logger?: (pluginName: string, message: string) => void;
}

/**
 * Nạp plugin từ source JS (nội dung file plugin.js).
 * Source phải gán `module.exports = { manifest, hooks }`.
 */
export function loadPluginFromSource(source: string, opts: LoadPluginOptions = {}): LoadedPlugin {
  if (typeof source !== "string" || source.trim().length === 0)
    throw new PluginError("nguồn plugin rỗng");

  const loadTimeout = opts.loadTimeoutMs ?? 2000;
  const logger = opts.logger ?? ((name: string, msg: string) => console.error(`[plugin:${name}] ${msg}`));

  // Global tối thiểu cho context.
  const moduleObj: { exports: unknown } = { exports: {} };
  let pluginName = "<unknown>";
  const log = (message: string) => logger(pluginName, String(message));

  const sandbox: Record<string, unknown> = {
    module: moduleObj,
    exports: moduleObj.exports,
    console: Object.freeze({
      log,
      info: log,
      warn: (m: string) => logger(pluginName, `warn: ${String(m)}`),
      error: (m: string) => logger(pluginName, `error: ${String(m)}`),
    }),
    vc: Object.freeze({ log, apiVersion: 1 as const }),
  };

  const ctx = createContext(sandbox, {
    name: "vcut-plugin",
    codeGeneration: { strings: false, wasm: false },
  });

  try {
    runInContext(source, ctx, { timeout: loadTimeout, filename: "plugin.js" });
  } catch (e) {
    throw new PluginError(`nạp plugin thất bại: ${errMsg(e)}`);
  }

  const mod = moduleObj.exports as PluginModule | undefined;
  if (!mod || typeof mod !== "object") throw new PluginError("plugin phải gán module.exports = { manifest, hooks }");
  if (!mod.hooks || typeof mod.hooks !== "object") throw new PluginError("plugin thiếu object hooks");

  const manifest = validateManifest(mod.manifest);
  pluginName = manifest.name;

  const implemented: string[] = [];
  for (const name of manifest.hooks) {
    const fn = (mod.hooks as Record<string, unknown>)[name];
    if (typeof fn !== "function") throw new PluginError(`manifest khai hook "${name}" nhưng hooks.${name} không phải function`);
    implemented.push(name);
  }

  // Đưa module vào trong context để invokeHook gọi qua runInContext (có timeout).
  sandbox["__plugin"] = mod;

  const config: Record<string, unknown> = {
    ...((manifest.defaultConfig ?? {}) as Record<string, unknown>),
    ...(opts.config ?? {}),
  };

  return { manifest, config, implementedHooks: implemented, _ctx: ctx, _log: log };
}

/**
 * Gọi 1 hook của plugin bên trong sandbox (timeout cứng).
 * ctx được JSON-clone vào trong; kết quả JSON-clone ra ngoài.
 * Trả về undefined nếu hook trả undefined/không tồn tại.
 */
export function invokeHook<T>(
  plugin: LoadedPlugin,
  hookName: string,
  ctxData: Record<string, unknown>,
  timeoutMs = 1000,
): T | undefined {
  const ctx = plugin._ctx;
  // Truyền tham số qua global của context — tránh nối chuỗi vào code.
  const sandbox = ctx as unknown as Record<string, unknown>;
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
  let raw: unknown;
  try {
    raw = runInContext(script, ctx, { timeout: timeoutMs });
  } catch (e) {
    throw new PluginError(`hook "${hookName}" của plugin "${plugin.manifest.name}" lỗi/timeout: ${errMsg(e)}`);
  } finally {
    delete sandbox["__hookName"];
    delete sandbox["__hookArgJson"];
  }
  if (raw === null || raw === undefined) return undefined;
  return JSON.parse(raw as string) as T;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
