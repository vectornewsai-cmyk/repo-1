/**
 * registry.ts — Plugin registry + capability registry (R1-105).
 *
 * Host (render worker / bridge / MCP) tạo 1 registry, nạp các plugin,
 * rồi gọi các helper chạy hook theo chuỗi:
 * - runClipRender: gom filter an toàn từ mọi plugin onClipRender.
 * - runProjectValidate: gom errors/warnings từ plugin validator.
 * - runExportStart/runExportFinish, emitTimelineAction: quan sát.
 *
 * Nguyên tắc: lỗi của 1 plugin KHÔNG làm sập host — được bắt lại và ghi
 * vào `hookErrors` trả về để UI/log hiển thị.
 */
import {
  type ClipRenderContext,
  type ClipRenderResult,
  type ExportFinishContext,
  type ExportFinishResult,
  type ExportStartContext,
  type PluginManifest,
  type RegisteredCapability,
} from "./types.js";
import { validatePluginFilters } from "./validate.js";
import { invokeHook, loadPluginFromSource, type LoadedPlugin, type LoadPluginOptions } from "./sandbox.js";

/** Kết quả chạy 1 nhóm hook: giá trị gom được + lỗi của từng plugin. */
export interface HookRunReport {
  /** Lỗi theo plugin (tên plugin -> message). Rỗng = mọi plugin OK. */
  hookErrors: Record<string, string>;
}

export interface ClipRenderReport extends HookRunReport {
  /** Filters đã validate, an toàn để nối vào filter chain của clip. */
  filters: string[];
}

export interface ValidateReport extends HookRunReport {
  errors: string[];
  warnings: string[];
}

export interface ExportFinishReport extends HookRunReport {
  warnings: string[];
}

/** Registry quản lý plugin đã nạp. */
export class PluginRegistry {
  private plugins = new Map<string, LoadedPlugin>();

  /** Nạp plugin từ source JS. Ném PluginError nếu tên trùng hoặc manifest sai. */
  load(source: string, opts: LoadPluginOptions = {}): PluginManifest {
    const plugin = loadPluginFromSource(source, opts);
    if (this.plugins.has(plugin.manifest.name))
      throw new Error(`[plugin-api] plugin "${plugin.manifest.name}" đã được nạp`);
    this.plugins.set(plugin.manifest.name, plugin);
    return plugin.manifest;
  }

  /** Gỡ plugin khỏi registry. */
  unload(name: string): boolean {
    return this.plugins.delete(name);
  }

  /** Danh sách manifest plugin đang nạp. */
  list(): PluginManifest[] {
    return [...this.plugins.values()].map((p) => p.manifest);
  }

  /** Kiểm tra plugin có đang nạp không. */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /** Capability registry: mọi capability của mọi plugin, kèm tên plugin. */
  listCapabilities(): RegisteredCapability[] {
    const out: RegisteredCapability[] = [];
    for (const p of this.plugins.values())
      for (const cap of p.manifest.capabilities ?? [])
        out.push({ ...cap, plugin: p.manifest.name });
    return out;
  }

  /**
   * Chạy chuỗi onClipRender cho 1 clip. Trả về filters hợp lệ đã gom
   * (theo thứ tự nạp plugin) + lỗi của từng plugin nếu có.
   */
  runClipRender(base: Omit<ClipRenderContext, "config">): ClipRenderReport {
    const filters: string[] = [];
    const hookErrors: Record<string, string> = {};
    for (const p of this.plugins.values()) {
      if (!p.implementedHooks.includes("onClipRender")) continue;
      try {
        const res = invokeHook<ClipRenderResult>(p, "onClipRender", { ...base, config: p.config });
        if (res?.filters) filters.push(...validatePluginFilters(res.filters));
      } catch (e) {
        hookErrors[p.manifest.name] = errMsg(e);
      }
    }
    return { filters, hookErrors };
  }

  /** Chạy chuỗi onProjectValidate, gom errors/warnings. */
  runProjectValidate(spec: Record<string, unknown>): ValidateReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const hookErrors: Record<string, string> = {};
    for (const p of this.plugins.values()) {
      if (!p.implementedHooks.includes("onProjectValidate")) continue;
      try {
        const res = invokeHook<{ errors?: string[]; warnings?: string[] }>(p, "onProjectValidate", { spec });
        for (const s of res?.errors ?? []) errors.push(`[${p.manifest.name}] ${String(s)}`);
        for (const s of res?.warnings ?? []) warnings.push(`[${p.manifest.name}] ${String(s)}`);
      } catch (e) {
        hookErrors[p.manifest.name] = errMsg(e);
      }
    }
    return { errors, warnings, hookErrors };
  }

  /** Phát sự kiện onExportStart tới mọi plugin quan tâm. */
  runExportStart(ctxData: Omit<ExportStartContext, "config">): HookRunReport {
    return this.broadcast("onExportStart", ctxData);
  }

  /** Chạy onExportFinish, gom warnings plugin thêm. */
  runExportFinish(ctxData: Omit<ExportFinishContext, "config">): ExportFinishReport {
    const warnings: string[] = [];
    const hookErrors: Record<string, string> = {};
    for (const p of this.plugins.values()) {
      if (!p.implementedHooks.includes("onExportFinish")) continue;
      try {
        const res = invokeHook<ExportFinishResult>(p, "onExportFinish", { ...ctxData, config: p.config });
        for (const s of res?.warnings ?? []) warnings.push(`[${p.manifest.name}] ${String(s)}`);
      } catch (e) {
        hookErrors[p.manifest.name] = errMsg(e);
      }
    }
    return { warnings, hookErrors };
  }

  /** Phát sự kiện timeline (action + payload tóm tắt) tới plugin quan sát. */
  emitTimelineAction(action: string, payload: Record<string, unknown>): HookRunReport {
    return this.broadcast("onTimelineAction", { action, payload });
  }

  /** Gọi hook kiểu quan sát: không lấy kết quả, chỉ thu lỗi. */
  private broadcast(hookName: string, data: Record<string, unknown>): HookRunReport {
    const hookErrors: Record<string, string> = {};
    for (const p of this.plugins.values()) {
      if (!p.implementedHooks.includes(hookName)) continue;
      const withConfig = hookName.startsWith("onExport") ? { ...data, config: p.config } : data;
      try {
        invokeHook(p, hookName, withConfig);
      } catch (e) {
        hookErrors[p.manifest.name] = errMsg(e);
      }
    }
    return { hookErrors };
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
