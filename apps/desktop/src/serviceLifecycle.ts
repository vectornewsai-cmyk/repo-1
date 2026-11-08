/**
 * serviceLifecycle.ts — Adapter nối ServiceManager (JS thuần, xem
 * src/services/serviceManager.js) vào main process TypeScript.
 *
 * Vì sao cần adapter: tsc (allowJs tắt) không copy file .js vào dist, nên
 * main.ts không thể `import` trực tiếp module JS. Adapter load module JS bằng
 * createRequire với 2 vị trí: dist/services/ (sau khi chạy
 * `node scripts/copy-services-js.mjs`) và src/services/ (fallback khi chạy
 * từ repo). Nếu cả hai đều thiếu, lỗi nêu rõ bước copy cần chạy.
 *
 * NỐI VÀO main.ts (G1 — chỉ cần thêm mấy dòng này, không sửa logic khác):
 *   import {
 *     initServiceLifecycle, startLocalServices, stopLocalServices,
 *     getLocalServicesSnapshot, localSnapshotToServiceStatus,
 *   } from "./serviceLifecycle";
 *   // trong app.whenReady(), TRƯỚC khi tạo window:
 *   initServiceLifecycle({
 *     appRoot: <repo root ở dev / resources/app khi đóng gói>,
 *     userDataDir: app.getPath("userData"),
 *     send: (snap) => {
 *       for (const w of BrowserWindow.getAllWindows()) {
 *         if (!w.isDestroyed()) w.webContents.send("vcut:services-status", snap);
 *       }
 *     },
 *   });
 *   startLocalServices().catch((e) => {
 *     dialog.showErrorBox("Không khởi động được service local", String(e?.message ?? e));
 *   });
 *   // handler desktop:get-services hiện tại (G1) đổi thành:
 *   ipcMain.handle("desktop:get-services", () => {
 *     const snap = getLocalServicesSnapshot();
 *     return snap ? localSnapshotToServiceStatus(snap) : getServicesStatus(DEV_MODE);
 *   });
 *   // trong before-quit (trước app.quit()):
 *   app.on("before-quit", async (e) => { e.preventDefault(); await stopLocalServices(); app.quit(); });
 *
 * NỐI VÀO preload.ts (G1/G3) — event, renderer KHÔNG poll:
 *   services: {
 *     ...,
 *     onServicesStatus: (cb) => {
 *       const h = (_e: unknown, snap: ServiceStatusSnapshot) => cb(snap);
 *       ipcRenderer.on("vcut:services-status", h);
 *       return () => ipcRenderer.removeListener("vcut:services-status", h);
 *     },
 *   }
 * LƯU Ý: web UI phải dùng snapshot.bridge.url (cổng thật, có thể khác 8787
 * khi 8787 bận) thay vì hardcode 8787 — xem LIMITS G2, mục "nợ mở".
 */
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ServiceStatus } from './services';
import type {
  ServiceManager,
  ServiceStatusSnapshot,
} from './services/serviceManager';
import type {
  CleanupStaleBridgeOptions,
  StaleBridgeCleanupResult,
} from './services/bridgePidfile';
import type {
  CleanupStaleElectronOptions,
  ElectronPidfileRecord,
  StaleElectronCleanupResult,
} from './services/electronOrphanCleanup';

const requireCjs = createRequire(__filename);

type ServiceManagerModule = typeof import('./services/serviceManager');
type BridgePidfileModule = typeof import('./services/bridgePidfile');
type ElectronOrphanModule = typeof import('./services/electronOrphanCleanup');

function loadElectronOrphanModule(): ElectronOrphanModule {
  const candidates = [
    // dist/services/ — sau `node scripts/copy-services-js.mjs`.
    path.join(__dirname, 'services', 'electronOrphanCleanup.js'),
    // Fallback khi chạy từ repo (tsc vừa build, chưa copy).
    path.join(__dirname, '..', 'src', 'services', 'electronOrphanCleanup.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return requireCjs(candidate) as ElectronOrphanModule;
    }
  }
  throw new Error(
    'Không tìm thấy electronOrphanCleanup.js — chạy `node scripts/copy-services-js.mjs` ' +
      'để copy apps/desktop/src/services/*.js vào dist/services/ rồi build lại.',
  );
}

function loadPidfileModule(): BridgePidfileModule {
  const candidates = [
    // dist/services/ — sau `node scripts/copy-services-js.mjs`.
    path.join(__dirname, 'services', 'bridgePidfile.js'),
    // Fallback khi chạy từ repo (tsc vừa build, chưa copy).
    path.join(__dirname, '..', 'src', 'services', 'bridgePidfile.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return requireCjs(candidate) as BridgePidfileModule;
    }
  }
  throw new Error(
    'Không tìm thấy bridgePidfile.js — chạy `node scripts/copy-services-js.mjs` ' +
      'để copy apps/desktop/src/services/*.js vào dist/services/ rồi build lại.',
  );
}

/**
 * Cổng CDP mà Electron đang dùng (harness truyền --remote-debugging-port;
 * mặc định 9222). Manager cần biết để cleanupStaleBridge kiểm tra socket
 * CDP có được giải phóng sau khi kill bridge mồ côi không.
 */
function cdpPortFromArgv(): number | undefined {
  for (const arg of process.argv) {
    const m = /^--remote-debugging-port=(\d+)$/.exec(arg);
    if (m) {
      const port = Number(m[1]);
      if (Number.isInteger(port) && port > 0 && port < 65536) return port;
    }
  }
  return undefined;
}

function loadManagerModule(): ServiceManagerModule {
  const candidates = [
    // dist/services/ — sau `node scripts/copy-services-js.mjs` (bắt buộc khi đóng gói).
    path.join(__dirname, 'services', 'serviceManager.js'),
    // Fallback khi chạy từ repo (tsc vừa build, chưa copy).
    path.join(__dirname, '..', 'src', 'services', 'serviceManager.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return requireCjs(candidate) as ServiceManagerModule;
    }
  }
  throw new Error(
    'Không tìm thấy serviceManager.js — chạy `node scripts/copy-services-js.mjs` ' +
      'để copy apps/desktop/src/services/*.js vào dist/services/ rồi build lại.',
  );
}

let manager: ServiceManager | null = null;

/**
 * Khởi tạo manager (chỉ 1 lần cho cả vòng đời app). `send` được gọi mỗi khi
 * trạng thái service đổi — main forward sang renderer qua webContents.send.
 */
export function initServiceLifecycle(opts: {
  appRoot: string;
  userDataDir: string;
  nodeBin?: string;
  send: (snap: ServiceStatusSnapshot) => void;
}): ServiceManager {
  if (manager) return manager;
  const mod = loadManagerModule();
  manager = mod.createServiceManager({
    appRoot: opts.appRoot,
    cdpPort: cdpPortFromArgv(),
    userDataDir: opts.userDataDir,
    nodeBin: opts.nodeBin,
    onStatus: (snap) => opts.send(snap),
  });
  return manager;
}

export function getServiceLifecycleManager(): ServiceManager | null {
  return manager;
}

/**
 * Đợt 51 H7 — dọn bridge mồ côi theo pidfile, KHÔNG cần manager đã init.
 *
 * ĐIỂM NỐI CHO H8 (loader mới): gọi hàm này TRƯỚC khi spawn Electron /
 * trước initServiceLifecycle nếu loader cần dọn sớm — vì Electron bind cổng
 * CDP lúc khởi động, TRƯỚC khi main.ts chạy, nên dọn trong start() thì cổng
 * CDP chỉ trống cho LẦN CHẠY SAU. Harness verify-desktop.mjs cũng gọi đường
 * này trước mỗi lần launch.
 *
 * Trong app thường thì KHÔNG cần gọi thêm: startLocalServices() đã dọn ở
 * đầu start(). Fail-closed: process lạ không bao giờ bị kill (xem
 * bridgePidfile.js).
 */
export function cleanupOrphanBridgeOnStartup(
  userDataDir: string,
  opts?: CleanupStaleBridgeOptions,
): Promise<StaleBridgeCleanupResult> {
  if (manager) return manager.cleanupStaleBridge();
  const mod = loadPidfileModule();
  return mod.cleanupStaleBridge(userDataDir, opts);
}

/**
 * Đợt 52 I4 — dọn renderer/GPU/utility/zygote con mồ côi của Electron VCut
 * (giữ socket CDP), KHÔNG cần manager đã init.
 *
 * Gọi TRƯỚC khi spawn Electron (harness) hoặc qua manager.start() (app
 * thường — lúc đó cổng CDP chỉ trống cho LẦN CHẠY SAU vì Electron bind
 * CDP trước khi main.ts chạy; xem electronOrphanCleanup.js). Fail-closed:
 * process lạ không bao giờ bị kill.
 */
export function cleanupOrphanElectronOnStartup(
  userDataDir: string,
  opts?: CleanupStaleElectronOptions,
): Promise<StaleElectronCleanupResult> {
  if (manager) return manager.cleanupStaleElectronChildren();
  const mod = loadElectronOrphanModule();
  return mod.cleanupStaleElectronChildren(userDataDir, opts);
}

/**
 * Đợt 52 I4 — ghi pidfile Electron (`electron.pid.json`) cho lần chạy này
 * để lần chạy sau nhận ra + dọn con mồ côi nếu app bị kill -9/crash. Gọi
 * ngay sau initServiceLifecycle (main.ts), sau khi đã giữ single-instance
 * lock. Best-effort: ghi lỗi chỉ log, không chặn app.
 */
export function recordElectronProcess(
  userDataDir: string,
  opts: { execPath: string; appPath: string | null },
): boolean {
  try {
    const mod = loadElectronOrphanModule();
    return mod.writeElectronPidfile(userDataDir, {
      appPath: opts.appPath,
      appPid: process.pid,
      cdpPort: cdpPortFromArgv(),
      execPath: opts.execPath,
      userDataDir,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[vcut-desktop] Không ghi được electron pidfile: ${e instanceof Error ? e.message : String(e)}`);
    return false;
  }
}

/** Khởi động bridge + probe AI. Ném lỗi rõ ràng nếu không khởi động được. */
export async function startLocalServices(): Promise<ServiceStatusSnapshot> {
  if (!manager) throw new Error('initServiceLifecycle() chưa được gọi');
  return manager.start();
}

/** Tắt sạch toàn bộ service (kill cả process group). Gọi trong before-quit. */
export async function stopLocalServices(): Promise<ServiceStatusSnapshot | null> {
  if (!manager) return null;
  const snap = await manager.stop();
  // Đợt 52 I4 — thoát sạch thì xoá pidfile Electron (best-effort): lần
  // chạy sau khỏi phải quét con mồ côi. Crash/kill -9 thì file còn lại
  // đúng như thiết kế (lưới an toàn cho lần chạy sau).
  try {
    const mod = loadElectronOrphanModule();
    mod.removeElectronPidfile(manager.userDataDir);
  } catch { /* bỏ qua — pidfile là lưới an toàn, không chặn thoát app */ }
  return snap;
}

export function getLocalServicesSnapshot(): ServiceStatusSnapshot | null {
  return manager ? manager.getStatus() : null;
}

/** URL thật của bridge (cổng có thể khác 8787) — web UI dùng URL này. */
export function getLocalBridgeUrl(): string | null {
  return manager ? manager.getBridgeUrl() : null;
}

/**
 * Chuyển snapshot lifecycle về đúng shape ServiceStatus[] mà main.ts /
 * preload.ts (G1) đang dùng, để handler `desktop:get-services` hiện tại
 * dùng được ngay mà không đổi contract với renderer.
 */
export function localSnapshotToServiceStatus(snap: ServiceStatusSnapshot): ServiceStatus[] {
  const out: ServiceStatus[] = [
    {
      name: 'bridge',
      ok: snap.bridge.state === 'running',
      detail: snap.bridge.url
        ? `${snap.bridge.url} (pid ${snap.bridge.pid ?? '?'})`
        : (snap.bridge.lastError ?? snap.bridge.state),
    },
  ];
  for (const svc of Object.values(snap.ai)) {
    out.push({
      name: svc.id,
      ok: svc.available,
      detail: svc.available ? svc.label : (svc.reason ?? svc.label),
    });
  }
  out.push({
    name: 'render',
    ok: snap.render.available,
    detail: snap.render.available ? 'on-demand qua bridge' : (snap.render.reason ?? 'không khả dụng'),
  });
  return out;
}
