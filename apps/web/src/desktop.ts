/**
 * desktop.ts — cầu nối renderer ↔ menu Electron (Phase 10, luồng G5).
 *
 * Chạy CHỈ khi web app được host trong Electron (`window.vcutDesktop`
 * do apps/desktop/src/preload.ts expose). Trên trình duyệt thường,
 * `isDesktop()` false và mọi hàm bridge là no-op an toàn.
 *
 * Luồng menu → renderer:
 * - Menu Chỉnh sửa (undo/redo/cắt/sao chép/dán/nhân bản/xóa/chọn tất
 *   cả) gửi `vcut:menu-action`; bridge gọi đúng hàm store (KHÔNG dùng
 *   role native của Electron — role chỉ tác động undo/clipboard của
 *   Chromium, editor dùng store riêng).
 * - Tệp > Mở / Dự án gần đây / double-click file gửi `vcut:open-file`
 *   kèm đường dẫn; bridge đọc file qua preload (G5, file-io.ts) rồi
 *   chạy đường mở dùng chung ở lib/openProjectFlow.ts (G4 tách từ
 *   ProjectMenu — cùng thứ tự replace → rehydrate → report).
 * - Tệp > Lưu / Lưu thành… ghi qua preload; Ctrl+S lưu thẳng vào
 *   đường dẫn project hiện tại nếu có.
 * - Xem > Ngôn ngữ gửi `vcut:language-changed`; bridge setLang web.
 *   Chiều ngược lại (nút ngôn ngữ trên TopBar) đi qua onLangChange →
 *   preload.notifyLanguageChanged để main rebuild menu.
 *
 * Phần G4 giữ, KHÔNG làm lại ở đây (lib/nativeFiles.ts): import media
 * nhiều file qua dialog hệ thống, chọn đích + lưu MP4 native, kéo-thả
 * file từ file manager vào cửa sổ.
 *
 * Kiểu `DesktopApiLike` là mirror tối thiểu của DesktopApi trong
 * apps/desktop/src/preload.ts (chỉ các method bridge dùng). Nếu preload
 * đổi chữ ký, tsc ở apps/desktop sẽ báo; bridge tự kiểm tra runtime
 * (typeof === "function") nên không crash khi chạy với preload cũ.
 */
import { useStore } from "./store";
import { setBridgeUrl } from "./lib/bridgeUrl";
import {
  buildNativeSavePayload,
  confirmDiscardProject,
  markCurrentProjectSaved,
  openArchiveFileFlow,
  openProjectFileFlow,
  saveNotesLinesForResult,
  snapshotHistoryAfterSave,
} from "./lib/openProjectFlow";
import { clearLastLoadReport } from "./lib/loadReport";
import { clearAutosave, markSaved } from "./lib/projectRepo";
import { pushToast } from "./lib/toast";
import { getLang, onLangChange, setLang, t, type Lang } from "./i18n";
import { promptProjectName } from "./components/project/RenameProjectDialog";

export type DesktopMenuActionId =
  | "copy"
  | "cut"
  | "delete"
  | "duplicate"
  | "export-video"
  | "new-project"
  | "paste"
  | "redo"
  | "save-project"
  | "save-project-as"
  | "select-all"
  | "undo";

/** Subset của window.vcutDesktop mà bridge dùng (mirror preload.ts). */
export interface DesktopApiLike {
  getBridgeUrl?: () => Promise<string>;
  getCurrentProjectPath: () => Promise<string | null>;
  getPaths?: () => Promise<{ logPath: string; settingsPath: string; userData: string }>;
  noteProjectOpened: (filePath: string) => Promise<{ ok: boolean }>;
  notifyLanguageChanged: (lang: Lang) => Promise<void>;
  onLanguageChanged: (cb: (lang: Lang) => void) => () => void;
  /**
   * Đợt 63 R9 — đẩy ngôn ngữ xuống preload để chuỗi lỗi của preload
   * đổi theo locale. Tùy chọn: preload cũ không có method này thì
   * bridge bỏ qua (typeof check), không crash.
   */
  setLanguage?: (lang: Lang) => void;
  onMenuAction: (cb: (action: DesktopMenuActionId) => void) => () => void;
  onOpenFile: (cb: (filePath: string) => void) => () => void;
  /** Bridge đổi cổng (restart) → cập nhật URL cho toàn bộ web UI. */
  onServicesStatus?: (
    cb: (snap: { bridge: { state: string; url: string | null } }) => void,
  ) => () => void;
  readMediaFile: (filePath: string) => Promise<
    | { data: ArrayBuffer; mime: string; name: string; ok: true; path: string; size: number }
    | { error: string; ok: false }
  >;
  readProjectFile: (filePath: string) => Promise<
    | { data: ArrayBuffer; kind: "zip"; name: string; ok: true; path: string }
    | { kind: "json"; name: string; ok: true; path: string; text: string }
    | { error: string; ok: false }
  >;
  saveProjectDialog: (defaultName?: string) => Promise<string | null>;
  setCurrentProjectPath: (filePath: string | null) => Promise<void>;
  writeProjectFile: (filePath: string, content: string) => Promise<{ error?: string; ok: boolean }>;
}

export function getDesktopApi(): DesktopApiLike | null {
  const w = window as unknown as { vcutDesktop?: DesktopApiLike };
  const api = w.vcutDesktop;
  if (!api || typeof api.onMenuAction !== "function") return null;
  return api;
}

export function isDesktop(): boolean {
  return getDesktopApi() !== null;
}

/** Các tổ hợp phím mà menu desktop đã nhận — App.tsx phải bỏ qua để không chạy trùng.
 * CHỈ gồm các tổ hợp có trong DESKTOP_MENU_SHORTCUTS (shortcuts.ts).
 * Ctrl+Y KHÔNG có trong menu (redo chỉ có Ctrl+Shift+Z) nên KHÔNG nằm
 * ở đây — App.tsx vẫn xử lý Ctrl+Y làm redo như bản web. */
const MENU_OWNED_KEYS = new Set(["a", "c", "d", "s", "v", "z"]);

export function isDesktopMenuShortcut(e: KeyboardEvent): boolean {
  if (!isDesktop()) return false;
  if (!(e.ctrlKey || e.metaKey)) return false;
  return MENU_OWNED_KEYS.has(e.key.toLowerCase());
}

/**
 * Tên file mặc định khi lưu. Cùng logic bỏ dấu của defaultProjectFileName
 * bên G4 (native-files.ts — "Đám cưới Lan Hùng" → "Dam cuoi Lan Hung",
 * tránh tên file bị xé dấu trên một số hệ thống), nhưng giữ đuôi
 * `.vcut.json` là đuôi chuẩn của web (PROJECT_FILE_EXT) thay vì `.vcut`.
 */
export function defaultProjectFileName(projectName: string): string {
  const stripped = (projectName || "du-an")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
  const safe = stripped.replace(/[^\w\- ]+/g, "").trim() || "du-an";
  return `${safe}.vcut.json`;
}

/**
 * Mở project từ đường dẫn tuyệt đối (menu / recent / double-click).
 * Trả false nếu user huỷ (có thay đổi chưa lưu) hoặc file lỗi.
 */
export async function openProjectFromPath(filePath: string): Promise<boolean> {
  const api = getDesktopApi();
  if (!api) return false;
  if (!confirmDiscardProject()) return false;
  const res = await api.readProjectFile(filePath);
  if (!res.ok) {
    pushToast(t("projectMenu.openFileError", { errors: res.error }), "error");
    return false;
  }
  let ok = false;
  if (res.kind === "zip") {
    const file = new File([res.data], res.name, { type: "application/zip" });
    ok = await openArchiveFileFlow(file);
  } else {
    const file = new File([res.text], res.name, { type: "application/json" });
    ok = await openProjectFileFlow(file);
  }
  if (ok) {
    // Báo main để cập nhật recent + current path (best-effort).
    void api.noteProjectOpened(filePath).catch(() => undefined);
  }
  return ok;
}

/** Thêm một file media từ đường dẫn tuyệt đối vào project (menu Tệp > Thêm media). */
export async function openMediaFromPath(filePath: string): Promise<boolean> {
  const api = getDesktopApi();
  if (!api) return false;
  const res = await api.readMediaFile(filePath);
  if (!res.ok) {
    pushToast(res.error, "error");
    return false;
  }
  const file = new File([res.data], res.name, { type: res.mime });
  await useStore.getState().importFiles([file]);
  return true;
}

/** Ghi project hiện tại ra file. `as` = true thì luôn hỏi đường dẫn mới (Lưu thành…).
 * `askName` (chỉ để test chích hàm hỏi tên giả; mặc định là dialog trong app):
 * hỏi tên mới trước khi mở dialog lưu native. */
export async function saveProjectDesktop(
  as: boolean,
  askName: (current: string) => Promise<string | null> = promptProjectName,
): Promise<boolean> {
  const api = getDesktopApi();
  if (!api) return false;
  const st = useStore.getState();
  let target: string | null = null;
  if (!as) {
    target = await api.getCurrentProjectPath();
  }
  if (as || !target) {
    if (as) {
      // ROUND53-J4: hỏi tên qua dialog nhập tên TRONG APP (component
      // RenameProjectDialog) thay cho window.prompt — renderer Electron
      // chạy sandboxed (main.ts sandbox:true) nên window.prompt() NÉM
      // "prompt() is not supported" (bug D3 đợt 51; fix tạm đợt 52 I3
      // chỉ bắt lỗi rồi bỏ qua bước đổi tên). Dialog ném lỗi (hiếm) thì
      // vẫn bỏ qua bước đổi tên như fallback D3, Lưu thành… tiếp tục
      // tới dialog lưu native. Cancel (null) → huỷ; chuỗi trắng → giữ
      // tên cũ nhưng vẫn lưu (khớp T4 của test đợt 52).
      let name: string | null = null;
      try {
        name = await askName(st.spec.meta.name);
      } catch {
        name = "";
      }
      if (name === null) return false; // bấm Cancel
      if (name.trim().length > 0) st.setProjectName(name.trim());
    }
    target = await api.saveProjectDialog(defaultProjectFileName(useStore.getState().spec.meta.name));
    if (!target) return false; // user huỷ dialog
  }
  const payload = buildNativeSavePayload();
  const written = await api.writeProjectFile(target, payload.json);
  if (!written.ok) {
    pushToast(written.error ?? t("desktop.saveError"), "error");
    return false;
  }
  await api.setCurrentProjectPath(target);
  markCurrentProjectSaved();
  snapshotHistoryAfterSave();
  const lines = saveNotesLinesForResult(payload);
  if (lines.length > 0) {
    pushToast(t("projectMenu.loadNotes", { notes: lines.join("; ") }), "info");
  } else {
    pushToast(t("projectMenu.saveDone"), "success");
  }
  return true;
}

export interface DesktopBridgeCallbacks {
  /** Mở panel Xuất video (như nút Xuất trên TopBar). */
  openExport: () => void;
}

/**
 * Xử lý một action menu. Trả về false nếu action không nhận ra (caller
 * có thể log). `getStore` cho phép test chích store giả; mặc định dùng
 * useStore.getState() thật.
 */
export async function handleMenuAction(
  action: DesktopMenuActionId,
  callbacks: DesktopBridgeCallbacks,
  getStore: () => ReturnType<typeof useStore.getState> = () => useStore.getState(),
): Promise<boolean> {
  const st = getStore();
  switch (action) {
    case "undo":
      st.undo();
      return true;
    case "redo":
      st.redo();
      return true;
    case "cut":
      st.copySelection();
      st.deleteSelection();
      return true;
    case "copy":
      st.copySelection();
      return true;
    case "paste":
      st.pasteClipboard();
      return true;
    case "duplicate":
      st.duplicateSelection();
      return true;
    case "delete":
      st.deleteSelection();
      return true;
    case "select-all": {
      const sels: { trackId: string; clipId: string }[] = [];
      for (const track of st.spec.tracks) {
        for (const clip of track.clips) sels.push({ trackId: track.id, clipId: clip.id });
      }
      st.selectMany(sels);
      return true;
    }
    case "new-project": {
      if (!confirmDiscardProject()) return true;
      st.newProject();
      // Đợt 64 R6 — không còn rotateProjectId() (xem ProjectMenu.doNew):
      // store.newProject đã xoay projectId envelope, lịch sử khóa theo id đó.
      clearAutosave();
      clearLastLoadReport();
      markSaved(getStore().spec);
      return true;
    }
    case "save-project":
      await saveProjectDesktop(false);
      return true;
    case "save-project-as":
      await saveProjectDesktop(true);
      return true;
    case "export-video":
      callbacks.openExport();
      return true;
    default:
      return false;
  }
}

/**
 * Đăng ký toàn bộ cầu nối desktop (menu, mở file, đồng bộ ngôn ngữ).
 * Gọi một lần trong App (useEffect). Trả về hàm dọn dẹp.
 */
export function initDesktopMenuBridge(callbacks: DesktopBridgeCallbacks): () => void {
  const api = getDesktopApi();
  if (!api) return () => undefined;
  const cleanups: Array<() => void> = [];
  cleanups.push(
    api.onMenuAction((action) => {
      void handleMenuAction(action, callbacks).then((handled) => {
        if (!handled) console.warn("[desktop] menu action không nhận ra:", action);
      });
    }),
  );
  cleanups.push(
    api.onOpenFile((filePath) => {
      void (async () => {
        const lower = filePath.toLowerCase();
        const isProject =
          lower.endsWith(".vcut") || lower.endsWith(".vcut.json") || lower.endsWith(".json") ||
          lower.endsWith(".vcut.zip") || lower.endsWith(".zip");
        if (isProject) {
          await openProjectFromPath(filePath);
        } else {
          await openMediaFromPath(filePath);
        }
      })();
    }),
  );
  // Ngôn ngữ: menu desktop đổi → web đổi theo; nút TopBar đổi → main đổi theo.
  cleanups.push(api.onLanguageChanged((lang) => setLang(lang)));
  cleanups.push(
    onLangChange((lang) => {
      // Đợt 63 R9: đẩy ngôn ngữ xuống preload để chuỗi lỗi của preload
      // (vd asArrayBuffer) đổi theo locale; preload cũ không có
      // setLanguage thì bỏ qua (typeof check).
      if (typeof api.setLanguage === "function") api.setLanguage(lang);
      void api.notifyLanguageChanged(lang).catch(() => { /* main chưa sẵn — bỏ qua */ });
    }),
  );
  // Đồng bộ lần đầu: nếu menu đã ở ngôn ngữ khác web (settings.json cũ),
  // web giữ ngôn ngữ của mình và báo lại main ở lần đổi tiếp theo.
  void api.notifyLanguageChanged(getLang()).catch(() => { /* bỏ qua */ });
  // Đợt 63 R9: đồng bộ lần đầu cho preload (cùng ngôn ngữ web đang dùng).
  if (typeof api.setLanguage === "function") api.setLanguage(getLang());
  // Phase 10 (gộp): bridge thật của desktop app có thể không ở 8787
  // (8787 bận → manager đổi cổng). Lấy URL thật một lần lúc mở app và
  // cập nhật mỗi khi services đổi trạng thái — BRIDGE_URL là live binding
  // nên mọi component gọi bridge đều dùng URL mới ngay, không cần reload.
  if (typeof api.getBridgeUrl === "function") {
    void api
      .getBridgeUrl()
      .then((url) => setBridgeUrl(url))
      .catch(() => { /* giữ mặc định 8787 */ });
  }
  if (typeof api.onServicesStatus === "function") {
    cleanups.push(
      api.onServicesStatus((snap) => {
        if (snap?.bridge?.url) setBridgeUrl(snap.bridge.url);
      }),
    );
  }
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
