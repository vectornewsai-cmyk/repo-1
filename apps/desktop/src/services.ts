/**
 * services.ts — kiểm tra sức khỏe các service local mà editor phụ thuộc.
 * Chỉ đọc trạng thái qua HTTP loopback, không tự khởi động service ở đây.
 * Vòng đời service (khởi động/tắt/restart) do serviceLifecycle.ts (G2)
 * quản lý — main.ts nối adapter đó; các hàm probe dưới đây chỉ là fallback
 * khi lifecycle chưa nối (vd: app đóng gói thiếu server/bridge).
 */
export interface ServiceStatus {
  detail?: string;
  name: string;
  ok: boolean;
}

export const BRIDGE_URL = "http://127.0.0.1:8787";
export const DEV_SERVER_URL = "http://127.0.0.1:5173";

async function probe(
  name: string,
  url: string,
  timeoutMs = 2000,
): Promise<ServiceStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return { detail: `HTTP ${res.status}`, name, ok: false };
    }
    let detail: string | undefined;
    try {
      const body = (await res.json()) as Record<string, unknown>;
      if (typeof body.version !== "undefined") detail = `v${String(body.version)}`;
      if (typeof body.ffmpeg === "string") {
        detail = detail ? `${detail}, ffmpeg ${body.ffmpeg}` : `ffmpeg ${body.ffmpeg}`;
      }
    } catch {
      // /api/health luôn trả JSON; lỗi parse thì vẫn tính là reachable.
    }
    return { detail, name, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { detail: msg, name, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

/** Bridge Express :8787 — render/caption/TTS/bgremove đều đi qua đây. */
export function probeBridge(): Promise<ServiceStatus> {
  return probe("bridge", `${BRIDGE_URL}/api/health`);
}

/** Vite dev server :5173 — chỉ có ý nghĩa ở chế độ dev. */
export function probeDevServer(): Promise<ServiceStatus> {
  return probe("vite-dev", DEV_SERVER_URL);
}

export async function getServicesStatus(devMode: boolean): Promise<ServiceStatus[]> {
  const checks: Promise<ServiceStatus>[] = [probeBridge()];
  if (devMode) checks.push(probeDevServer());
  return Promise.all(checks);
}
