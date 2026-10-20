/**
 * i18n/index.ts — hệ thống đa ngôn ngữ tối giản cho VCut Studio (R1-107).
 *
 * - Hai ngôn ngữ: `vi` (mặc định) và `en`.
 * - Chuỗi lưu trong `vi.json` / `en.json`, truy cập bằng `t("topbar.play")`.
 * - Ngôn ngữ đang chọn lưu trong localStorage (`vcut-lang`).
 * - Thiếu key ở `en` → fallback về `vi` → cuối cùng trả về chính key.
 *
 * Phạm vi hiện tại: chuỗi giao diện chính (TopBar, splash, MediaBin, nút đóng modal).
 * Các panel chuyên sâu (Inspector, Timeline...) vẫn hardcode tiếng Việt — hạ tầng
 * đã sẵn sàng để dịch dần, xem `i18n/README.md`.
 */
import { useSyncExternalStore } from "react";
import vi from "./vi.json";
import en from "./en.json";

const DICTS = { vi, en } as const;
export type Lang = keyof typeof DICTS;

function lookup(dict: unknown, key: string): string | undefined {
  let cur: unknown = dict;
  for (const part of key.split(".")) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

const STORAGE_KEY = "vcut-lang";
let lang: Lang = "vi";
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "vi" || saved === "en") lang = saved;
} catch {
  /* localStorage không khả dụng (SSR/test) — giữ mặc định */
}

const listeners = new Set<() => void>();

export function getLang(): Lang {
  return lang;
}

export function setLang(next: Lang): void {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* bỏ qua */
  }
  listeners.forEach((fn) => fn());
}

/** Lấy chuỗi theo key, có fallback vi → key. Hỗ trợ thay thế `{name}`. */
export function t(key: string, vars?: Record<string, string>): string {
  const raw =
    lookup(DICTS[lang], key) ?? lookup(DICTS.vi, key) ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
}

/** Hook React: re-render component khi đổi ngôn ngữ. */
export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    getLang,
    getLang
  );
}
