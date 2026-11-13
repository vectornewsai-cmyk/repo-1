/**
 * windowState.ts — nhớ kích thước/vị trí/trạng thái maximize của cửa sổ
 * giữa các lần mở app. Lưu JSON ở userData (Linux: ~/.config/VCut Studio/).
 */
import { app } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";
// Đợt 85 M5: ghi file qua helper retry EPERM + verify đủ byte (port JS của
// apps/web/scripts/eperm-retry.mjs; xem services/epermRetry.js).
import { writeFileEpermRetry } from "./services/epermRetry.js";

export interface WindowState {
  height: number;
  maximized: boolean;
  width: number;
  x?: number;
  y?: number;
}

const DEFAULT_STATE: WindowState = { height: 900, maximized: false, width: 1440 };

function stateFile(): string {
  return path.join(app.getPath("userData"), "window-state.json");
}

function isValidNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Đọc state đã lưu; file hỏng/thiếu thì trả default (không crash app). */
export function loadWindowState(): WindowState {
  try {
    const raw = fs.readFileSync(stateFile(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<WindowState>;
    if (!isValidNumber(parsed.width) || !isValidNumber(parsed.height)) {
      return { ...DEFAULT_STATE };
    }
    const state: WindowState = {
      height: Math.max(640, Math.min(4320, Math.floor(parsed.height))),
      maximized: parsed.maximized === true,
      width: Math.max(1024, Math.min(7680, Math.floor(parsed.width))),
    };
    // Bỏ tọa độ âm/vô lý (đổi màn hình) để cửa sổ không "mất tích".
    if (isValidNumber(parsed.x) && isValidNumber(parsed.y) && parsed.x >= 0 && parsed.y >= 0) {
      state.x = Math.floor(parsed.x);
      state.y = Math.floor(parsed.y);
    }
    return state;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/** Ghi state khi đóng cửa sổ; lỗi ghi thì bỏ qua lặng (không chặn quit). */
export function saveWindowState(state: WindowState): void {
  try {
    fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
    writeFileEpermRetry(stateFile(), JSON.stringify(state), { label: "desktop-window-state.json" });
  } catch {
    // Không chặn thoát app vì lỗi ghi state.
  }
}
