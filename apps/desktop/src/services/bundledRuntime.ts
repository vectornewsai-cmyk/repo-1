/**
 * bundledRuntime.ts — Xác định runtime (node + cây server) mà app desktop
 * dùng để chạy bridge/render khi đóng gói (ROUND51-H8).
 *
 * Vấn đề (Phase 10, xem docs/PHASE10_LIMITS.md §5.1): app đóng gói KHÔNG
 * chứa server/bridge nên `startLocalServices()` ném "không tìm thấy bridge",
 * render/caption/TTS/bgremove trong app đóng gói không chạy được.
 *
 * Cách giải quyết ở đợt này (không cần tải Node riêng, không tăng gói
 * thêm ~90MB cho một binary node):
 * - Cây server (bridge + render + script Python text + node_modules thu gọn
 *   chỉ cho bridge + assets/filters/*.cube) được stage lúc đóng gói vào
 *   `resources/vcut-server/` (xem apps/desktop/scripts/copy-bundled-server.mjs
 *   + `extraResources` trong apps/desktop/package.json).
 * - Node để chạy bridge là CHÍNH binary Electron của app, chạy ở chế độ
 *   Node thuần nhờ biến môi trường `ELECTRON_RUN_AS_NODE=1` — NHƯNG chỉ
 *   trong cây bridge, qua launcher `resources/vcut-server/bin/vcut-node`
 *   (xem apps/desktop/scripts/vcut-node). TUYỆT ĐỐI KHÔNG đặt biến này
 *   vào env của main process: mọi tiến trình con Chromium (zygote, GPU,
 *   renderer, network service) cũng khởi động bằng cùng binary và kế thừa
 *   env — chúng sẽ chạy dạng Node, báo "/proc/self/exe: bad option:
 *   --type=utility" rồi chết, cửa sổ không bao giờ load (gặp thật 06/11:
 *   smoke AppImage timeout 120s, network service crash liên tục, trong khi
 *   bridge vẫn chạy tốt). Launcher exec Electron với biến chỉ trong env của
 *   bridge; bridge spawn render worker bằng `process.execPath` KHÔNG
 *   override env nên render kế thừa biến từ bridge — cả chuỗi đúng mà
 *   không cần sửa serviceManager.js / serviceLifecycle.ts.
 *
 * Thứ tự ưu tiên khi chọn node (đầu tiên thắng):
 *   1. `VCUT_NODE` (env, user chỉ định rõ) — dùng đúng binary đó.
 *   2. Node thật đi kèm gói tại `<vcut-server>/bin/node` (nếu có — đợt này
 *      CHƯA ship file đó, chỉ để sẵn đường để đợt sau quyết định).
 *   3. Packaged + có cây server bundle: launcher `bin/vcut-node` — chạy
 *      binary Electron ở chế độ Node, giới hạn trong cây bridge.
 *   4. Node hệ thống trong PATH (`node`) + cây server ở repo (dev) hoặc
 *      `resources/app` (packaged, hành vi cũ — bridge sẽ không tìm thấy
 *      và manager báo failed như Phase 10, app vẫn mở).
 *
 * Module này KHÔNG spawn gì, KHÔNG import electron: chỉ đọc filesystem
 * (fs.existsSync) nên test được bằng Node thuần (xem
 * src/services/bundledRuntime.test.cjs). Việc truyền nodeBin vào
 * lifecycle nằm ở main.ts (điểm nối ROUND51-H8) — KHÔNG sửa
 * serviceLifecycle.ts / services.ts (luồng H7 sở hữu).
 */
import * as fs from "node:fs";
import * as path from "node:path";

/** Tên thư mục cây server bundle trong `process.resourcesPath`. */
export const BUNDLED_SERVER_DIRNAME = "vcut-server";

/** Biến môi trường khiến binary Electron chạy như Node.js thuần. */
export const ELECTRON_RUN_AS_NODE = "ELECTRON_RUN_AS_NODE";

/** Launcher trong bundle — "node" của app đóng gói (xem scripts/vcut-node). */
export const BUNDLED_NODE_LAUNCHER_REL = path.join("bin", "vcut-node");

/** Đường tương đối (từ appRoot) tới entry của bridge và render worker. */
export const BRIDGE_ENTRY_REL = path.join("server", "bridge", "src", "index.js");
export const RENDER_ENTRY_REL = path.join("server", "render", "src", "render.js");

export type BundledRuntimeMode =
  | "electron-as-node"
  | "bundled-node"
  | "system-node";

export interface BundledRuntime {
  /** Thư mục gốc của cây server — serviceManager dùng làm `appRoot`. */
  appRoot: string;
  /** Đường tuyệt đối tới server/bridge/src/index.js (có thể không tồn tại). */
  bridgeEntry: string;
  /** Đường tuyệt đối tới server/render/src/render.js (có thể không tồn tại). */
  renderEntry: string;
  /** Thư mục cây server bundle, null khi không đóng gói/không có bundle. */
  bundledServerDir: string | null;
  /** Binary dùng để spawn bridge (`nodeBin` của ServiceManager). */
  nodeBin: string;
  /**
   * Env bổ sung phải có khi spawn bridge. Luôn rỗng ở đợt này: chế độ
   * electron-as-node dùng launcher script để đặt ELECTRON_RUN_AS_NODE=1
   * CHỈ trong cây bridge (xem ghi chú đầu file) — KHÔNG bao giờ đặt biến
   * này vào env của main process. Giữ field để đợt sau có thể nối
   * nodeEnv qua serviceLifecycle (seam, chưa dùng).
   */
  nodeEnv: Record<string, string>;
  mode: BundledRuntimeMode;
  /** true khi bridge entry tồn tại (đủ điều kiện để manager thử start). */
  ok: boolean;
  /** Mô tả ngắn gọn cho log + kênh `desktop:get-services` (preload). */
  detail: string;
}

export interface ResolveBundledRuntimeOpts {
  /** `app.isPackaged` — true khi chạy từ AppImage/.deb đã đóng gói. */
  isPackaged: boolean;
  /** `process.resourcesPath` — thư mục resources/ của app đóng gói. */
  resourcesPath: string;
  /** Gốc repo khi chạy dev (dist → desktop → apps → repo). */
  repoRoot: string;
  /** `process.execPath` — binary Electron đang chạy. */
  execPath?: string;
  /** Env để đọc override — mặc định `process.env` (test truyền env giả). */
  env?: NodeJS.ProcessEnv;
  /**
   * Ghi đè thư mục bundle (chỉ dùng cho test/smoke: trỏ tới cây đã stage
   * mà không cần đóng gói). Khi set, nó thắng cả `resourcesPath`.
   */
  bundledServerDirOverride?: string;
}

function isExecutableFile(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * Xác định runtime cho lần chạy này. Hàm thuần (chỉ đọc fs + env truyền
 * vào) — không có tác dụng phụ, gọi lại bao nhiêu lần cũng được.
 * LƯU Ý: hàm này KHÔNG chạm vào `process.env` — xem ghi chú đầu file
 * về việc ELECTRON_RUN_AS_NODE làm nhiễm tiến trình con Chromium.
 */
export function resolveBundledRuntime(opts: ResolveBundledRuntimeOpts): BundledRuntime {
  const env = opts.env ?? process.env;
  const execPath = opts.execPath ?? process.execPath;
  const bundledServerDir = opts.bundledServerDirOverride
    ? path.resolve(opts.bundledServerDirOverride)
    : opts.isPackaged
      ? path.join(opts.resourcesPath, BUNDLED_SERVER_DIRNAME)
      : null;
  const bundledBridge = bundledServerDir
    ? path.join(bundledServerDir, BRIDGE_ENTRY_REL)
    : null;
  const bundledBridgeExists = !!bundledBridge && fs.existsSync(bundledBridge);

  // appRoot: packaged + có bundle → cây bundle; dev → repo; packaged nhưng
  // không có bundle → resources/app (hành vi Phase 10, bridge sẽ thiếu).
  const appRoot = bundledBridgeExists
    ? (bundledServerDir as string)
    : opts.isPackaged
      ? path.join(opts.resourcesPath, "app")
      : path.resolve(opts.repoRoot);
  const bridgeEntry = path.join(appRoot, BRIDGE_ENTRY_REL);
  const renderEntry = path.join(appRoot, RENDER_ENTRY_REL);
  const ok = fs.existsSync(bridgeEntry);

  // 1. VCUT_NODE — user chỉ định rõ, thắng mọi chế độ.
  const vcutNode = (env.VCUT_NODE ?? "").trim();
  if (vcutNode) {
    return {
      appRoot,
      bridgeEntry,
      renderEntry,
      bundledServerDir: bundledBridgeExists ? bundledServerDir : null,
      detail: ok
        ? `node từ VCUT_NODE (${vcutNode}), bridge tại ${bridgeEntry}`
        : `node từ VCUT_NODE (${vcutNode}) nhưng KHÔNG tìm thấy bridge (${bridgeEntry})`,
      mode: "system-node",
      nodeBin: vcutNode,
      nodeEnv: {},
      ok,
    };
  }

  // 2. Node thật đi kèm gói (đợt này chưa ship — chỉ để sẵn đường).
  const bundledNodeBin = bundledServerDir
    ? path.join(bundledServerDir, "bin", "node")
    : null;
  if (bundledNodeBin && isExecutableFile(bundledNodeBin)) {
    return {
      appRoot,
      bridgeEntry,
      renderEntry,
      bundledServerDir,
      detail: ok
        ? `node đi kèm gói (${bundledNodeBin}), bridge tại ${bridgeEntry}`
        : `node đi kèm gói (${bundledNodeBin}) nhưng KHÔNG tìm thấy bridge (${bridgeEntry})`,
      mode: "bundled-node",
      nodeBin: bundledNodeBin,
      nodeEnv: {},
      ok,
    };
  }

  // 3. Packaged + có bundle: launcher bin/vcut-node — chạy binary Electron
  // ở chế độ Node, giới hạn trong cây bridge (xem scripts/vcut-node).
  const launcher = bundledServerDir
    ? path.join(bundledServerDir, BUNDLED_NODE_LAUNCHER_REL)
    : null;
  if (opts.isPackaged && bundledBridgeExists && launcher && fs.existsSync(launcher)) {
    return {
      appRoot,
      bridgeEntry,
      renderEntry,
      bundledServerDir,
      detail:
        `node = launcher bundle (${launcher}, chạy binary Electron dạng ` +
        `Node qua ${ELECTRON_RUN_AS_NODE}=1 chỉ trong cây bridge), bridge tại ${bridgeEntry}`,
      mode: "electron-as-node",
      nodeBin: launcher,
      nodeEnv: {},
      ok: true,
    };
  }

  // 4. Fallback: node hệ thống trong PATH.
  return {
    appRoot,
    bridgeEntry,
    renderEntry,
    bundledServerDir: bundledBridgeExists ? bundledServerDir : null,
    detail: ok
      ? `node hệ thống (PATH), bridge tại ${bridgeEntry}`
      : opts.isPackaged
        ? `KHÔNG có bridge trong gói (${bridgeEntry}) — app vẫn mở, render/AI cần bridge chạy tay`
        : `node hệ thống (PATH), bridge tại ${bridgeEntry}`,
    mode: "system-node",
    nodeBin: "node",
    nodeEnv: {},
    ok,
  };
}

/**
 * Bảo đảm launcher `bin/vcut-node` có quyền thực thi (best-effort).
 * electron-builder/fpm thường giữ nguyên mode 0755 từ lúc stage, nhưng
 * AppImage-extract hoặc copy tay có thể làm mất bit +x — spawn khi đó sẽ
 * lỗi EACCES khó hiểu. Hàm này chmod lại khi cần; thất bại (vd: resources
 * chỉ đọc sau khi cài .deb) thì trả về false và ghi log ở main, KHÔNG ném.
 */
export function ensureBundledRuntimeExecutable(runtime: BundledRuntime): boolean {
  if (runtime.mode !== "electron-as-node") return true;
  try {
    if (isExecutableFile(runtime.nodeBin)) return true;
    fs.chmodSync(runtime.nodeBin, 0o755);
    return isExecutableFile(runtime.nodeBin);
  } catch {
    return false;
  }
}
