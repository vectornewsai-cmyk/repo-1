/**
 * main.ts — main process của VCut Studio (Electron).
 *
 * - Single instance: mở app lần 2 thì focus cửa sổ cũ (và mở file .vcut
 *   kèm theo nếu có).
 * - Production: UI web đã build ở apps/desktop/dist-web, phục vụ qua
 *   scheme `app://vcut/` (xem protocol.ts — vì sao không loadFile).
 * - Dev: load Vite dev server http://127.0.0.1:5173 (chờ server sẵn sàng).
 * - Preload an toàn: contextIsolation + nodeIntegration=false + sandbox.
 * - IPC tối thiểu: thông tin app, trạng thái service, dialog hệ thống.
 *
 * Smoke test (bằng chứng chạy thật, không claim suông):
 *   VCUT_DESKTOP_SMOKE=1 xvfb-run -a electron .
 * Sau khi UI load xong, main tự kiểm tra window.vcutDesktop, tiêu đề trang,
 * số node con của #root, chụp màn hình ra VCUT_DESKTOP_SMOKE_SHOT
 * (mặc định /tmp/vcut-desktop-smoke.png), in JSON VCUT_SMOKE_RESULT rồi quit.
 */
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { wireDesktopUx, type DesktopUx } from "./desktop-ux";
import {
  findProjectPathInArgv,
  LastDirStore,
  registerExportFileIpc,
} from "./native-files";
import { APP_ORIGIN, registerAppProtocol, registerAppSchemePrivileges } from "./protocol";
import { BRIDGE_URL, getServicesStatus } from "./services";
import {
  getLocalBridgeUrl,
  getLocalServicesSnapshot,
  getServiceLifecycleManager,
  initServiceLifecycle,
  localSnapshotToServiceStatus,
  recordElectronProcess,
  startLocalServices,
  stopLocalServices,
} from "./serviceLifecycle";
import { checkFfmpeg, ffmpegInstallHint } from "./ffmpeg-check";
import { getDesktopLabels, tDesktopVars, type DesktopLabels } from "./i18n-desktop";
import { loadWindowState, saveWindowState } from "./windowState";
// ROUND51-H8: loader runtime bundle (node + cây server trong gói) — xem
// src/services/bundledRuntime.ts. Chỉ main.ts nối ở đây; KHÔNG sửa hàm
// lifecycle trong serviceLifecycle.ts / services.ts (luồng H7 sở hữu).
import {
  ensureBundledRuntimeExecutable,
  resolveBundledRuntime,
  type BundledRuntime,
} from "./services/bundledRuntime";
// ROUND52-I5: downloader model AI lần đầu (xem src/services/modelDownloader.js
// + model-manifest.json). Load bằng createRequire như serviceLifecycle làm
// với module JS thuần (tsc allowJs tắt không copy .js vào dist).
import type {
  ModelDownloadProgress,
  ModelDownloadResult,
  ModelsRootInfo,
  ModelStatus,
} from "./services/modelDownloader";

type ModelDownloaderModule = typeof import("./services/modelDownloader");
const requireCjs = createRequire(__filename);
let modelDownloaderMod: ModelDownloaderModule | null = null;
function loadModelDownloader(): ModelDownloaderModule {
  if (modelDownloaderMod) return modelDownloaderMod;
  const candidates = [
    path.join(__dirname, "services", "modelDownloader.js"),
    path.join(__dirname, "..", "src", "services", "modelDownloader.js"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      modelDownloaderMod = requireCjs(candidate) as ModelDownloaderModule;
      return modelDownloaderMod;
    }
  }
  throw new Error(
    "Không tìm thấy modelDownloader.js — chạy `node scripts/copy-services-js.mjs` " +
      "để copy apps/desktop/src/services/*.js vào dist/services/ rồi build lại.",
  );
}

registerAppSchemePrivileges();

const DEV_MODE =
  process.env.VCUT_DESKTOP_DEV === "1" || process.argv.includes("--dev");
const DEV_SERVER_URL = "http://127.0.0.1:5173";
const SMOKE_MODE = process.env.VCUT_DESKTOP_SMOKE === "1";

let mainWindow: BrowserWindow | null = null;
let pendingOpenFile: string | null = null;
// Phase 10 G4 — chỉ nhớ thư mục gần nhất của dialog (recent + đọc/ghi
// file thuộc file-io.ts / settings.ts / desktop-ux.ts của G5).
let lastDirs: LastDirStore | null = null;
let desktopUx: DesktopUx | null = null;

// Đợt 61 R6 — nhãn dialog theo ngôn ngữ hiện tại (đọc lúc mở dialog,
// không cache lúc đăng ký, để đổi ngôn ngữ từ TopBar có hiệu lực ngay).
function desktopLabels(): DesktopLabels {
  return getDesktopLabels(desktopUx?.settings.get().lang ?? "vi");
}

// Đợt 61 R6 — chuỗi model IPC có biến {…} (dịch theo ngôn ngữ hiện tại).
function mt(key: string, vars: Record<string, string>): string {
  return tDesktopVars(desktopUx?.settings.get().lang ?? "vi", key, vars);
}
// Phase 10 (gộp, G2): lifecycle services đã nối chưa — false khi app
// đóng gói thiếu server/bridge (xem main(): start thất bại thì app vẫn
// mở, chỉ báo services không khả dụng, không crash).
let servicesWired = false;
// ROUND51-H8: runtime bundle đã resolve cho lần chạy này (null trước khi
// main() chạy) — handler desktop:get-services append thêm 1 entry
// "bundled-runtime" để renderer thấy rõ bridge đang chạy từ bundle,
// node hệ thống, hay không có bridge trong gói.
let bundledRuntime: BundledRuntime | null = null;
// ROUND52-I5: thư mục model AI lần chạy này (resolve sau khi có appRoot +
// userDataDir — 'unified' = userData/models ở app đóng gói, 'repo' = model
// trong repo ở dev). Handler desktop:get-services append thêm 1 entry
// "models" để renderer thấy rõ model nào thiếu (app không crash, không treo
// khi thiếu model — Python AI chỉ báo không khả dụng, xem pythonServices.js).
let modelsRoot: ModelsRootInfo | null = null;
// Lượt tải model đang chạy (tối đa 1 lượt cùng lúc — model 2,2G tải song
// song 2 lượt chỉ làm chậm nhau + khó resume).
let currentDownload: { modelId: string; controller: AbortController } | null = null;
let quittingForServices = false;

function log(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log("[vcut-desktop]", ...args);
}

/** File .vcut (hoặc media) được mở từ ngoài: gửi về renderer khi có cửa sổ. */
function handleOpenFile(filePath: string): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // ROUND54-K4 (D1 argv): cửa sổ đang load thì preload chưa chạy —
    // send lúc này sẽ mất (chưa có ipcRenderer để nhận). Giữ lại, xả
    // ở did-finish-load trong createWindow.
    if (mainWindow.webContents.isLoading()) {
      pendingOpenFile = filePath;
      log(`open-file: cửa sổ đang load — giữ lại ${filePath} để gửi sau did-finish-load`);
      return;
    }
    mainWindow.webContents.send("vcut:open-file", filePath);
    log(`open-file: đã gửi ${filePath} về renderer`);
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    pendingOpenFile = filePath;
    log(`open-file: chưa có cửa sổ — giữ lại ${filePath}`);
  }
}

/** Gửi file đang chờ cho renderer (nếu còn) — lấy + xóa để không gửi 2 lần. */
function flushPendingOpenFile(): void {
  if (!pendingOpenFile) return;
  const filePath = pendingOpenFile;
  pendingOpenFile = null;
  handleOpenFile(filePath);
}

async function waitForDevServer(timeoutMs = 30000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(DEV_SERVER_URL, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch {
      // Dev server chưa lên — chờ tiếp.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function createWindow(): Promise<void> {
  const state = loadWindowState();
  const win = new BrowserWindow({
    backgroundColor: "#0f131b",
    height: state.height,
    minHeight: 640,
    minWidth: 1024,
    show: false,
    title: "VCut Studio",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      sandbox: true,
    },
    width: state.width,
    x: state.x,
    y: state.y,
  });
  mainWindow = win;
  if (state.maximized) win.maximize();
  // Phase 10 G5 — menu + crash handlers + file IPC (đúng 1 đối số).
  desktopUx = wireDesktopUx(win);

  win.once("ready-to-show", () => win.show());

  // ROUND54-K4 (D1 argv): second-instance có thể tới trong lúc cửa sổ
  // đang load — handleOpenFile giữ file lại, xả ngay khi load xong.
  // LƯU Ý: did-finish-load có thể bắn khi isLoading() vẫn true
  // (sub-resource chưa xong) — flush lúc đó bị handleOpenFile giữ lại
  // rồi không còn dịp xả (listener once), file kẹt mãi trong
  // pendingOpenFile (D1 đo được onOpenFile=false dù main đã log "xả").
  // Nên chờ did-stop-loading (lúc isLoading() chắc chắn false) mới xả.
  win.webContents.once("did-finish-load", () => {
    if (!pendingOpenFile) return;
    const flush = () => {
      if (pendingOpenFile) {
        log(`open-file: load xong — xả file đang chờ ${pendingOpenFile}`);
        flushPendingOpenFile();
      }
    };
    if (win.webContents.isLoading()) {
      win.webContents.once("did-stop-loading", flush);
    } else {
      flush();
    }
  });

  win.on("close", () => {
    saveWindowState({
      height: win.getBounds().height,
      maximized: win.isMaximized(),
      width: win.getBounds().width,
      x: win.getBounds().x,
      y: win.getBounds().y,
    });
  });
  win.on("closed", () => {
    mainWindow = null;
  });

  if (DEV_MODE) {
    const ready = await waitForDevServer();
    if (!ready) {
      log(`Vite dev server ${DEV_SERVER_URL} không phản hồi sau 30s — vẫn thử load.`);
    }
    await win.loadURL(DEV_SERVER_URL);
    log(`Đã load dev server ${DEV_SERVER_URL}`);
  } else {
    await win.loadURL(`${APP_ORIGIN}/index.html`);
    log(`Đã load UI production ${APP_ORIGIN}/index.html`);
  }

  // ROUND54-K4 (D1 argv): file argv/second-instance chờ từ trước lúc
  // load — listener load-xong ở trên sẽ xả; còn lại thì xả ở đây (nếu
  // cửa sổ đã load xong thì gửi luôn, chưa thì giữ lại cho listener xả).
  flushPendingOpenFile();

  if (SMOKE_MODE) void runSmokeCheck(win);
}

interface SmokeResult {
  // Phase 10 G1 — kết quả fetch bridge từ renderer (kiểm chứng CORS
  // DESKTOP_ORIGIN_RE): "ok" | "http-<status>" | "fetch-error:..." | "skipped".
  bridgeFromRenderer?: string;
  // Phase 10 (gộp): URL bridge mà web UI đang dùng (live binding
  // lib/bridgeUrl.ts) — phải khớp cổng thật của manager, không phải 8787
  // cứng, khi 8787 bận. null = web chưa kịp set (preload/desktop init).
  bridgeUrl?: string | null;
  error?: string;
  // Phase 10 G4 — chỉ ghi nhận, chưa chặn ok (xem LIMITS G4 §5).
  hasNativeFileApi?: boolean;
  hasPreloadApi?: boolean;
  ok: boolean;
  rootChildren?: number;
  screenshot?: string;
  screenshotError?: string;
  secureContext?: boolean;
  textLen?: number;
  textSample?: string;
  title?: string;
  url?: string;
}

/** Kiểm tra thật sau khi UI load: preload API, #root render, chụp màn hình. */
async function runSmokeCheck(win: BrowserWindow): Promise<void> {
  const shotPath =
    process.env.VCUT_DESKTOP_SMOKE_SHOT ?? "/tmp/vcut-desktop-smoke.png";
  const hardTimeout = setTimeout(() => {
    log("VCUT_SMOKE_RESULT " + JSON.stringify({ error: "timeout", ok: false } satisfies SmokeResult));
    app.quit();
  }, 30000);
  // Chụp màn hình dưới Xvfb/software GL có thể lỗi Viz (UnknownVizError)
  // dù DOM đã render — tách riêng để lỗi chụp không che kết quả probe.
  let probeError: string | undefined;
  let screenshotError: string | undefined;
  try {
    // Editor load project mẫu bất đồng bộ (màn hình "Đang mở dự án..."):
    // chờ tối đa 15s cho tới khi nội dung editor thật xuất hiện rồi mới chụp.
    const deadline = Date.now() + 15000;
    let probe: {
      bridgeUrl: string | null;
      hasNativeFileApi: boolean;
      hasPreloadApi: boolean;
      rootChildren: number;
      secureContext: boolean;
      textLen: number;
      textSample: string;
      title: string;
      url: string;
    } = { bridgeUrl: null, hasNativeFileApi: false, hasPreloadApi: false, rootChildren: -1, secureContext: false, textLen: 0, textSample: "", title: "", url: "" };
    while (Date.now() < deadline) {
      probe = (await win.webContents.executeJavaScript(
        `(() => ({
          bridgeUrl: typeof window.__VCUT_BRIDGE_URL__ === "string" ? window.__VCUT_BRIDGE_URL__ : null,
          hasNativeFileApi: typeof window.vcutDesktop === "object" && typeof window.vcutDesktop.readProjectFile === "function",
          hasPreloadApi: typeof window.vcutDesktop === "object" && typeof window.vcutDesktop.getInfo === "function",
          rootChildren: document.querySelector("#root") ? document.querySelector("#root").children.length : -1,
          secureContext: window.isSecureContext,
          textLen: document.body ? document.body.innerText.length : 0,
          textSample: document.body ? document.body.innerText.slice(0, 400) : "",
          title: document.title,
          url: location.href,
        }))()`,
      )) as typeof probe;
      if (probe.rootChildren > 0 && probe.textLen > 300) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    // Nội dung editor đã lên — chờ thêm tối đa 5s để web UI kịp lấy URL
    // bridge thật qua preload (initDesktopMenuBridge chạy async sau mount;
    // probe vỡ sớm ở vòng đầu sẽ đọc bridgeUrl null dù wiring đúng).
    if (probe.rootChildren > 0 && probe.textLen > 300 && probe.bridgeUrl === null) {
      const urlDeadline = Date.now() + 5000;
      while (Date.now() < urlDeadline && probe.bridgeUrl === null) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        probe = (await win.webContents.executeJavaScript(
          `(() => ({
            bridgeUrl: typeof window.__VCUT_BRIDGE_URL__ === "string" ? window.__VCUT_BRIDGE_URL__ : null,
            hasNativeFileApi: typeof window.vcutDesktop === "object" && typeof window.vcutDesktop.readProjectFile === "function",
            hasPreloadApi: typeof window.vcutDesktop === "object" && typeof window.vcutDesktop.getInfo === "function",
            rootChildren: document.querySelector("#root") ? document.querySelector("#root").children.length : -1,
            secureContext: window.isSecureContext,
            textLen: document.body ? document.body.innerText.length : 0,
            textSample: document.body ? document.body.innerText.slice(0, 400) : "",
            title: document.title,
            url: location.href,
          }))()`,
        )) as typeof probe;
      }
    }
    // Probe CORS bridge từ renderer (kiểm chứng thay đổi DESKTOP_ORIGIN_RE
    // ở server/bridge — fetch này đi từ origin app://vcut, khác với probe
    // ở main process vốn không chịu CORS). Dùng URL thật của bridge do
    // lifecycle manager chọn (có thể khác 8787 khi 8787 bận); chờ manager
    // khởi động xong (tối đa ~10s) rồi mới lấy URL, nếu không probe sẽ
    // fetch nhầm 8787 trong lúc manager còn đang chọn cổng.
    let bridgeFromRenderer = "skipped";
    const bridgeUrlDeadline = Date.now() + 10000;
    while (getLocalBridgeUrl() === null && Date.now() < bridgeUrlDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    const bridgeProbeUrl = `${getLocalBridgeUrl() ?? BRIDGE_URL}/api/health`;
    try {
      bridgeFromRenderer = (await win.webContents.executeJavaScript(
        `fetch(${JSON.stringify(bridgeProbeUrl)}, { method: "GET" }).then((r) => (r.ok ? "ok" : "http-" + r.status)).catch((e) => "fetch-error:" + (e && e.message ? e.message : String(e)))`,
      )) as string;
    } catch (err) {
      bridgeFromRenderer = "probe-error:" + (err instanceof Error ? err.message : String(err));
    }
    try {
      const image = await win.webContents.capturePage();
      fs.writeFileSync(shotPath, image.toPNG());
    } catch (err) {
      screenshotError = err instanceof Error ? err.message : String(err);
    }
    const result: SmokeResult = {
      bridgeFromRenderer,
      bridgeUrl: probe.bridgeUrl,
      error: probeError,
      hasNativeFileApi: probe.hasNativeFileApi,
      hasPreloadApi: probe.hasPreloadApi,
      ok: probe.hasPreloadApi && probe.rootChildren > 0 && probe.textLen > 300,
      rootChildren: probe.rootChildren,
      screenshot: screenshotError ? undefined : shotPath,
      screenshotError,
      secureContext: probe.secureContext,
      textLen: probe.textLen,
      textSample: probe.textSample,
      title: probe.title,
      url: probe.url,
    };
    log("VCUT_SMOKE_RESULT " + JSON.stringify(result));
  } catch (err) {
    probeError = err instanceof Error ? err.message : String(err);
    log(
      "VCUT_SMOKE_RESULT " +
        JSON.stringify({ error: probeError, ok: false } satisfies SmokeResult),
    );
  } finally {
    clearTimeout(hardTimeout);
    app.quit();
  }
}

// Phase 10 G4 — dialog G1 nay nhớ thư mục gần nhất (lastDir) qua
// LastDirStore. LƯU Ý: KHÔNG đăng ký `desktop:get-paths` ở đây —
// file-io.ts của G5 (qua wireDesktopUx) đã đăng ký kênh đó; đăng ký
// trùng ipcMain.handle sẽ throw và crash app lúc khởi động.
function registerIpc(lastDirs: LastDirStore): void {
  ipcMain.handle("desktop:get-info", () => ({
    appVersion: app.getVersion(),
    arch: process.arch,
    chrome: process.versions.chrome ?? "",
    electron: process.versions.electron ?? "",
    node: process.versions.node ?? "",
    platform: process.platform,
  }));

  // Phase 10 (gộp, G2): khi lifecycle manager đã chạy, trạng thái thật
  // (bridge URL/cổng thật, AI probe sâu) thắng probe HTTP nông của G1.
  // Khi manager chưa nối (app đóng gói thiếu server/bridge) thì giữ probe.
  // ROUND51-H8: append thêm entry "bundled-runtime" (từ loader
  // bundledRuntime) để renderer thấy rõ nguồn của bridge đang chạy.
  // ROUND52-I5: append thêm entry "models" (từ modelDownloader) để
  // renderer thấy rõ model AI nào thiếu — app thiếu model thì báo rõ,
  // không crash, không treo; Python AI chỉ bật khi model đã có.
  ipcMain.handle("desktop:get-services", async () => {
    const snap = getLocalServicesSnapshot();
    const list = snap ? localSnapshotToServiceStatus(snap) : await getServicesStatus(DEV_MODE);
    if (bundledRuntime) {
      list.push({
        detail: bundledRuntime.detail,
        name: "bundled-runtime",
        ok: bundledRuntime.ok,
      });
    }
    if (modelsRoot) {
      try {
        const dl = loadModelDownloader();
        const all = await dl.checkAllModels(modelsRoot);
        const verified = Object.values(all).filter((m: ModelStatus) => m.verified);
        const ready = verified.filter((m: ModelStatus) => m.status === "ready");
        const missing = verified.filter((m: ModelStatus) => m.status !== "ready");
        list.push({
          detail:
            missing.length === 0
              ? mt("models.allReady", {
                  ready: String(ready.length),
                  total: String(verified.length),
                  root: modelsRoot.root,
                })
              : mt("models.missing", {
                  missing: missing.map((m: ModelStatus) => `${m.label} (${m.sizeLabel})`).join(", "),
                  root: modelsRoot.root,
                }),
          name: "models",
          ok: missing.length === 0,
        });
      } catch (err) {
        list.push({
          detail: mt("models.checkFailed", {
            detail: err instanceof Error ? err.message : String(err),
          }),
          name: "models",
          ok: false,
        });
      }
    }
    return list;
  });

  // ROUND52-I5 — Model AI tải riêng lần đầu (xem modelDownloader.js).
  // get-models: trạng thái từng model (kiểm tra nhanh size, không hash).
  // download-model: tải 1 model (tối đa 1 lượt cùng lúc), progress bắn về
  // renderer qua event vcut:model-download-progress; xong thì probe lại AI
  // để service vừa đủ model bật lên mà không restart bridge.
  // cancel-model-download: huỷ lượt đang tải (.part giữ lại để resume).
  ipcMain.handle("desktop:get-models", async () => {
    if (!modelsRoot) return { ok: false, error: mt("models.noRoot", {}) };
    try {
      const dl = loadModelDownloader();
      return { ok: true, root: modelsRoot, models: await dl.checkAllModels(modelsRoot) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
  ipcMain.handle("desktop:download-model", async (_e, modelId: unknown) => {
    if (!modelsRoot) return { ok: false, error: mt("models.noRoot", {}) };
    if (typeof modelId !== "string" || !modelId) return { ok: false, error: mt("models.emptyId", {}) };
    if (currentDownload) {
      return {
        ok: false,
        error: mt("models.alreadyDownloading", { modelId: currentDownload.modelId }),
      };
    }
    const dl = loadModelDownloader();
    const controller = new AbortController();
    currentDownload = { modelId, controller };
    try {
      const result: ModelDownloadResult = await dl.downloadModel(modelsRoot, modelId, {
        signal: controller.signal,
        onProgress: (p: ModelDownloadProgress) => {
          for (const w of BrowserWindow.getAllWindows()) {
            if (!w.isDestroyed()) w.webContents.send("vcut:model-download-progress", p);
          }
        },
      });
      // Model vừa đủ → probe lại AI để UI thấy service bật lên.
      try {
        await getServiceLifecycleManager()?.reprobeAi();
      } catch (err) {
        log(`models: tải xong ${modelId} nhưng probe lại AI lỗi (${err instanceof Error ? err.message : String(err)}) — khởi động lại app để thấy trạng thái mới.`);
      }
      return { ok: true, ...result };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      if (currentDownload?.controller === controller) currentDownload = null;
    }
  });
  ipcMain.handle("desktop:cancel-model-download", () => {
    if (!currentDownload) return { ok: false, error: mt("models.noDownload", {}) };
    currentDownload.controller.abort();
    return { ok: true, modelId: currentDownload.modelId };
  });

  // URL thật của bridge cho web UI (có thể khác 8787) — xem lib/bridgeUrl.ts.
  // Chờ manager khởi động xong (tối đa ~10s) để trả URL thật NGAY lần đầu:
  // nếu trả fallback 8787 trong lúc manager còn đang chọn cổng, web UI sẽ
  // gọi nhầm cổng cũ cho tới khi event services-status sửa lại sau.
  ipcMain.handle("desktop:get-bridge-url", async () => {
    const deadline = Date.now() + 10000;
    for (;;) {
      const snap = getLocalServicesSnapshot();
      if (!snap) break;
      if (snap.bridge.state === "running") return snap.bridge.url ?? BRIDGE_URL;
      if (snap.bridge.state === "failed" || snap.bridge.state === "stopped") break;
      if (Date.now() >= deadline) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return getLocalBridgeUrl() ?? BRIDGE_URL;
  });

  ipcMain.handle("desktop:ffmpeg-status", () => checkFfmpeg());

  // G5 — web app đổi ngôn ngữ (nút trên TopBar) → lưu settings.json +
  // rebuild menu cho khớp. Main → renderer chiều ngược lại đi qua menu
  // (Xem > Ngôn ngữ gửi 'vcut:language-changed'), không qua kênh này
  // nên không có vòng lặp. Ngôn ngữ lạ thì bỏ qua lặng.
  // G4 fix (06/11): handler cũ gọi setAppMenu(mainWindow, ...) với chữ
  // ký cũ — menu.ts nay nhận MenuDeps nên sẽ throw; và nó dùng store
  // singleton getDesktopSettings, khác instance với store mà wireDesktopUx
  // giữ cho menu (hai bản sao trong RAM có thể lệch nhau). Dùng đúng
  // store + rebuildMenu của desktopUx để menu đổi ngôn ngữ ngay.
  ipcMain.handle("desktop:language-changed", (_e, lang: unknown) => {
    if (lang !== "vi" && lang !== "en") return;
    if (!desktopUx || !mainWindow || mainWindow.isDestroyed()) return;
    desktopUx.settings.setLang(lang);
    desktopUx.rebuildMenu();
  });

  ipcMain.handle("desktop:dialog-open-project", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      defaultPath: lastDirs.getLastDir(),
      filters: [
        { extensions: ["vcut"], name: desktopLabels().dialogs.projectFilter },
        { extensions: ["json"], name: "JSON" },
        { extensions: ["*"], name: desktopLabels().dialogs.allFiles },
      ],
      properties: ["openFile"],
      title: desktopLabels().dialogs.openProject,
    });
    if (!result.canceled && result.filePaths[0]) {
      lastDirs.noteFileSelection(result.filePaths[0]);
    }
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle("desktop:dialog-save-project", async (_e, defaultName?: string) => {
    if (!mainWindow) return null;
    const lastDir = lastDirs.getLastDir();
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath:
        lastDir && defaultName ? path.join(lastDir, defaultName) : (defaultName ?? "du-an-chua-dat-ten.vcut"),
      filters: [
        { extensions: ["vcut"], name: desktopLabels().dialogs.projectFilter },
        { extensions: ["*"], name: desktopLabels().dialogs.allFiles },
      ],
      title: desktopLabels().dialogs.saveProject,
    });
    // ROUND53-J1: log kết quả dialog để chẩn đoán M4/M5/D2a (đợt 52:
    // gõ path qua dialog GTK không ghi file) — cho biết dialog trả về
    // path nào hay bị huỷ, để phân biệt lỗi dialog/harness với lỗi ghi
    // file của renderer.
    log(`dialog-save-project: canceled=${result.canceled} filePath=${result.filePath ?? "(none)"}`);
    if (!result.canceled && result.filePath) {
      lastDirs.noteFileSelection(result.filePath);
    }
    return result.canceled ? null : (result.filePath ?? null);
  });

  ipcMain.handle("desktop:dialog-open-media", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      defaultPath: lastDirs.getLastDir(),
      filters: [
        {
          extensions: ["mp4", "mov", "webm", "mkv", "avi", "mp3", "wav", "ogg", "flac", "png", "jpg", "jpeg", "webp", "gif"],
          name: desktopLabels().dialogs.mediaFilter,
        },
        { extensions: ["*"], name: desktopLabels().dialogs.allFiles },
      ],
      properties: ["openFile", "multiSelections"],
      title: desktopLabels().dialogs.addMedia,
    });
    if (!result.canceled && result.filePaths.length > 0) {
      for (const p of result.filePaths) lastDirs.noteFileSelection(p);
    }
    return result.canceled ? null : result.filePaths;
  });

  ipcMain.handle("desktop:dialog-save-video", async (_e, defaultName?: string) => {
    if (!mainWindow) return null;
    const lastDir = lastDirs.getLastDir();
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath:
        lastDir && defaultName ? path.join(lastDir, defaultName) : (defaultName ?? "vcut-export.mp4"),
      filters: [
        { extensions: ["mp4"], name: "Video MP4" },
        { extensions: ["*"], name: desktopLabels().dialogs.allFiles },
      ],
      title: desktopLabels().dialogs.exportVideo,
    });
    if (!result.canceled && result.filePath) {
      lastDirs.noteFileSelection(result.filePath);
    }
    return result.canceled ? null : (result.filePath ?? null);
  });
}

async function main(): Promise<void> {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    log("Đã có instance khác đang chạy — thoát.");
    app.quit();
    return;
  }
  app.on("second-instance", (_event, argv) => {
    const file = findProjectPathInArgv(argv);
    if (file) handleOpenFile(file);
    else if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  // macOS: mở app bằng file .vcut.
  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    handleOpenFile(filePath);
  });

  const firstFile = findProjectPathInArgv(process.argv);
  // ROUND54-K4 (D1 argv): log rõ argv có file không — đợt 53 log app
  // không có dòng argv nào nên không phân biệt được "argv không tới
  // main" với "event tới nhưng renderer chưa đăng ký listener".
  log(
    `argv: ${process.argv.length} phần tử, file project trong argv: ${firstFile ?? "(không có)"}`,
  );
  if (firstFile) pendingOpenFile = firstFile;

  await app.whenReady();
  // Phase 10 (gộp, G2): khởi động bridge + probe AI local cùng app.
  // ROUND51-H8: appRoot + nodeBin lấy từ loader bundledRuntime —
  // packaged: bridge/render bundle trong resources/vcut-server, chạy bằng
  // launcher bin/vcut-node (binary Electron ở chế độ Node, biến
  // ELECTRON_RUN_AS_NODE=1 chỉ trong cây bridge — KHÔNG đặt vào env của
  // main process vì sẽ làm nhiễm tiến trình con Chromium); dev: bridge
  // từ repo + node hệ thống (như trước). Nếu gói không có bundle,
  // start() ném lỗi "không tìm thấy bridge" — bắt lại, app vẫn mở bình
  // thường, chỉ báo services không khả dụng. Không chặn cửa sổ chờ
  // services: start chạy nền, renderer lấy URL thật qua
  // desktop:get-bridge-url.
  bundledRuntime = resolveBundledRuntime({
    execPath: process.execPath,
    isPackaged: app.isPackaged,
    repoRoot: path.join(__dirname, "..", "..", ".."),
    resourcesPath: process.resourcesPath,
  });
  if (!ensureBundledRuntimeExecutable(bundledRuntime)) {
    log(`bundled-runtime: CẢNH BÁO không chmod được launcher ${bundledRuntime.nodeBin} — spawn bridge có thể lỗi EACCES.`);
  }
  log(
    `bundled-runtime: mode=${bundledRuntime.mode} node=${bundledRuntime.nodeBin} ` +
      `appRoot=${bundledRuntime.appRoot} — ${bundledRuntime.detail}`,
  );
  // ROUND52-I5: thư mục model AI cho lần chạy này — app đóng gói dùng
  // userData/models (tải riêng lần đầu), dev dùng model trong repo.
  try {
    const dl = loadModelDownloader();
    modelsRoot = dl.resolveModelsRoot({
      appRoot: bundledRuntime.appRoot,
      env: process.env,
      userDataDir: app.getPath("userData"),
    });
    const all = await dl.checkAllModels(modelsRoot);
    const verified = Object.values(all).filter((m: ModelStatus) => m.verified);
    const ready = verified.filter((m: ModelStatus) => m.status === "ready");
    log(
      `models: layout=${modelsRoot.layout} root=${modelsRoot.root} — ` +
      `${ready.length}/${verified.length} model sẵn sàng` +
      (ready.length < verified.length
        ? ` (thiếu: ${verified.filter((m: ModelStatus) => m.status !== "ready").map((m: ModelStatus) => m.label).join(", ")})`
        : ""),
    );
  } catch (err) {
    log(`models: không kiểm tra được model AI (${err instanceof Error ? err.message : String(err)}) — AI sẽ báo không khả dụng, app vẫn mở.`);
  }
  try {
    initServiceLifecycle({
      appRoot: bundledRuntime.appRoot,
      nodeBin: bundledRuntime.nodeBin,
      send: (snap) => {
        for (const w of BrowserWindow.getAllWindows()) {
          if (!w.isDestroyed()) w.webContents.send("vcut:services-status", snap);
        }
      },
      userDataDir: app.getPath("userData"),
    });
    servicesWired = true;
    // Đợt 52 I4 — ghi pidfile Electron cho lần chạy này (appPid + execPath
    // + appPath + CDP) để lần chạy sau dọn renderer/GPU con mồ côi nếu app
    // bị kill -9/crash. Đã giữ single-instance lock ở đầu main() nên không
    // sợ ghi đè pidfile của instance khác. Best-effort, không chặn app.
    recordElectronProcess(app.getPath("userData"), {
      appPath: app.getAppPath(),
      execPath: process.execPath,
    });
    void startLocalServices()
      .then((snap) => log(`services: bridge ${snap.bridge.url ?? "(chưa có URL)"} — ${snap.bridge.state}`))
      .catch((err) => {
        log(`services: không khởi động được (${err instanceof Error ? err.message : String(err)}) — app vẫn mở, render/AI cần bridge chạy tay.`);
      });
  } catch (err) {
    log(`services: không nối được lifecycle (${err instanceof Error ? err.message : String(err)}) — dùng probe HTTP như trước.`);
  }
  // Phase 10 G3 — kiểm tra ffmpeg hệ thống (render/export dùng ffmpeg trên
  // PATH; thiếu thì báo rõ cách cài, không chặn app mở).
  const ffmpeg = checkFfmpeg();
  if (ffmpeg.ok) {
    log(`ffmpeg: ${ffmpeg.version ?? ffmpeg.path}`);
  } else {
    log(`ffmpeg KHÔNG tìm thấy (${ffmpeg.path}): ${ffmpeg.error ?? ""}`);
    if (!SMOKE_MODE) {
      void dialog.showMessageBox({
        detail: `${ffmpegInstallHint(desktopUx?.settings.get().lang ?? "vi")}\n\n${desktopLabels().ffmpeg.stillUsable}`,
        message: desktopLabels().ffmpeg.notFoundTitle,
        type: "warning",
      });
    }
  }
  // Phase 10 G4 — chỉ nhớ thư mục gần nhất của dialog; recent + đọc/ghi
  // file thuộc desktop-ux (G5), nối trong createWindow().
  lastDirs = new LastDirStore(app.getPath("userData"));
  registerAppProtocol();
  registerIpc(lastDirs);
  registerExportFileIpc(ipcMain, BRIDGE_URL, lastDirs, () => desktopUx?.settings.get().lang ?? "vi");
  await createWindow();

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  // Phase 10 (gộp, G2): tắt sạch bridge + job đang chạy trước khi thoát,
  // không để tiến trình mồ côi. Guard quittingForServices tránh vòng lặp
  // preventDefault → quit → before-quit.
  app.on("before-quit", (e) => {
    if (!servicesWired || quittingForServices) return;
    e.preventDefault();
    quittingForServices = true;
    void stopLocalServices()
      .catch((err) => {
        log(`services: lỗi khi tắt (${err instanceof Error ? err.message : String(err)})`);
      })
      .finally(() => app.quit());
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[vcut-desktop] Lỗi khởi động:", err);
  app.quit();
});
