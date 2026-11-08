/**
 * openProjectFlow.ts — đường mở project/bản nén dùng chung (Phase 10, G4).
 *
 * Tách nguyên vẹn từ ProjectMenu.tsx (onFile/onArchiveFile): cùng thứ tự
 * replaceProject → rehydrate → checkMissingMedia → load report → toast.
 * ProjectMenu (nút Mở / Nhập bản nén, input file ẩn) và adapter native
 * (apps/web/src/lib/nativeFiles.ts — dialog hệ thống + IPC) đều gọi hai
 * hàm dưới đây với đối tượng File đã có, nên hành vi hai đường mở khớp
 * nhau. Không đổi luồng mở/lưu, không reformat.
 */
import { useStore } from "../store";
import {
  autosave,
  autosaveNow,
  binMediaFromMedia,
  clearAutosave,
  isDirty,
  loadProject,
  markSaved,
  serializeProject,
  type StructuredNote,
} from "./projectRepo";
import { importArchive } from "./archive";
import { pushToast } from "./toast";
import { AssetStore } from "./assetStore";
import { rehydrateMediaItems } from "./rehydrate36S5";
// Đợt 54 K7 — kiểm tra proxy còn sống khi rehydrate sau khi mở file
// (y hệt đường autosave ở App.tsx) + origin bridge hiện tại.
import { checkProxyAlive } from "./proxy";
import { BRIDGE_URL } from "./bridgeUrl";
import { t } from "../i18n";
import type { ImportFileProgressEvent } from "./ingestProgress39T5";
// Đợt 27 K5 (load report): chỉ 3 dòng ghi/xoá báo cáo lần load gần
// nhất — không đổi luồng mở/lưu, không reformat file.
import {
  buildLoadReport,
  formatNoteLines,
  formatOverflowLine,
  formatStructuredNote,
  formatWarningTranslated,
  setLastLoadReport,
  type LoadReport,
} from "./loadReport";
import {
  adoptLegacyHistoryChain,
  getHistoryStore,
} from "./projectHistory";
// Đợt 66 T7 — mảnh legacy mơ hồ → UI nhận thủ công (LegacyHistoryAdoptModal).
import { queueAmbiguousFromAdoptResult } from "./legacyAdoptUi";

/** Hỏi xác nhận trước khi bỏ thay đổi chưa lưu (y hệt ProjectMenu). */
export function confirmDiscardProject(): boolean {
  const st = useStore.getState();
  if (!isDirty(st.spec)) return true;
  return window.confirm(t("openProject.unsavedConfirm"));
}

/**
 * Đợt 30 M4 — toast lưu ý sau khi MỞ FILE / NHẬP BẢN NÉN, dịch theo
 * locale hiện tại (y hệt warnListReport trong ProjectMenu).
 */
function warnListReport(report: LoadReport): void {
  const lines = [
    ...report.warnings.map((w) => formatWarningTranslated(w, (k, vars) => t(k, vars))),
    ...report.structuredNotes.map((n) => formatStructuredNote(n, (k, vars) => t(k, vars))),
    ...report.otherWarnings,
  ];
  if (report.atCap)
    lines.push(
      report.overflowCount != null
        ? formatOverflowLine(report.overflowCount, (k, vars) => t(k, vars))
        : t("loadReport.atCap"),
    );
  if (lines.length > 0) {
    pushToast(t("projectMenu.loadNotes", { notes: lines.join("; ") }), "info");
  }
}

/**
 * Nạp lại media bin từ AssetStore TRƯỚC checkMissingMedia (đợt 37 T3 —
 * thứ tự y hệt đường khôi phục autosave ở App.tsx). Fail-soft như đường
 * autosave: IndexedDB bị chặn thì bin rỗng và Relink báo như hành vi cũ.
 */
async function rehydrateAfterOpen(spec: Parameters<typeof rehydrateMediaItems>[1]): Promise<void> {
  try {
    const assetStore = new AssetStore();
    const rehydrated = await rehydrateMediaItems(
      {
        listManifests: () => assetStore.list(),
        loadBlob: (id) => assetStore.getBlob(id),
        makeObjectURL: (blob) => URL.createObjectURL(blob),
        // Đợt 54 K7 — như đường autosave ở App.tsx: ghép proxyUrl với
        // origin bridge hiện tại + HEAD kiểm tra file proxy còn không
        // (chỉ 404 chắc chắn mới bị coi là chết).
        proxyBaseUrl: BRIDGE_URL,
        checkProxyUrl: checkProxyAlive,
      },
      spec,
    );
    if (rehydrated.items.length > 0) {
      useStore.getState().restoreMediaBin(rehydrated.items);
    }
    // Đợt 54 K7 — proxy chết: xóa proxyPath khỏi manifest (như App.tsx)
    // để lần sau khỏi kiểm tra lại đường dẫn chết; item đã mang
    // proxyStale nên MediaBin hiện nút tạo lại.
    if (rehydrated.staleProxies.length > 0) {
      for (const s of rehydrated.staleProxies) {
        try {
          await assetStore.setProxy(s.assetId, null);
        } catch {
          // best-effort: chỉ mất dọn manifest, item vẫn báo stale
        }
      }
      pushToast(
        t("openProject.proxyStaleToast", {
          names: rehydrated.staleProxies.map((s) => `"${s.name}"`).join(", "),
        }),
        "info",
      );
    }
  } catch {
    // IndexedDB không khả dụng → giữ bin rỗng, Relink báo như cũ.
  }
}

/**
 * Mở file project (.vcut/.vcut.json/.json) — thân hàm onFile của
 * ProjectMenu, trừ phần confirm + chọn file. Trả false khi parse lỗi
 * (đã toast lỗi); true khi mở xong.
 */
export async function openProjectFileFlow(file: File): Promise<boolean> {
  const res = await loadProject(file, t);
  if (!res.ok || !res.spec) {
    pushToast(t("projectMenu.openFileError", { errors: res.errors.join("; ") }), "error");
    return false;
  }
  const st = useStore.getState();
  // Đợt 63 R7 — mở file giữ nguyên projectId trong envelope (file cũ
  // thì parseProjectText đã migration sinh mới — id đó đi vào store
  // để lần lưu sau persist nó vào file thay vì sinh id khác nữa).
  st.replaceProject(res.spec, res.projectId);
  st.setProjectName(res.name);
  // Đợt 64 R6 — nhận chuỗi lịch sử legacy (khóa theo tên file) về
  // projectId envelope: từ nay lịch sử khóa theo id ổn định, đổi tên
  // hay sửa nội dung rồi mở lại không đứt chuỗi nữa. Best-effort, chờ
  // xong trước khi trả về để HistoryPanel mở ngay sau đó liệt kê đủ
  // (adopt không bao giờ throw — lỗi kho chỉ bỏ qua lặng lẽ).
  // Đợt 65 S9 — đưa spec đang mở làm bằng chứng nội dung (hash spec)
  // để adopt phân biệt được 2 file khác nhau cùng tên file, và quét
  // thêm chuỗi legacy phân mảnh của cùng project.
  // Đợt 66 T7 — chuỗi/mảnh mơ hồ (tên khớp nhưng hash lệch) không tự
  // nhận: đưa vào hàng đợi UI nhận thủ công (LegacyHistoryAdoptModal)
  // để user xem bằng chứng rồi quyết định nhận/bỏ.
  const adoptResult = await adoptLegacyHistoryChain(res.projectId, file.name, undefined, { spec: res.spec });
  queueAmbiguousFromAdoptResult(adoptResult);
  markSaved(res.spec);
  clearAutosave();
  // Đợt 60 Q7 — đóng race debounce 5s (nợ đợt 59 P1 §5.1): `autosave()`
  // cũ lên lịch ghi hoãn KHÔNG kèm binMedia TRƯỚC khi rehydrate chạy
  // xong; rehydrate chậm hơn 5s thì lần ghi cũ đó đáp xuống trước, rồi
  // effect autosave sau restore mới ghi lại đúng — reload đúng trong
  // cửa sổ đó thấy envelope thiếu binMedia (media bin-only vắng 1 lần
  // reload, test binOrphan60Q7 C-R2 khóa cửa sổ này). Nay ghi ngay
  // (autosaveNow) + ghi lại ngay sau rehydrate kèm binMedia đúng; không
  // còn lần ghi hoãn nào mang envelope thiếu manifest chờ bắn (và
  // autosaveNow cũng hủy timer chờ — xem projectRepo.ts).
  autosaveNow(res.spec, res.name, undefined, undefined, res.projectId);
  await rehydrateAfterOpen(res.spec);
  autosaveNow(res.spec, res.name, undefined, binMediaFromMedia(useStore.getState().media), res.projectId);
  st.checkMissingMedia(); // R1-033: hiện panel relink nếu media thiếu
  const fileReport = buildLoadReport(res, "file", res.name);
  warnListReport(fileReport);
  setLastLoadReport(fileReport);
  return true;
}

/**
 * Nhập file .vcut.zip — thân hàm onArchiveFile của ProjectMenu, trừ phần
 * confirm + chọn file. `onImportProgress` nhận tiến trình importFiles của
 * media trong bản nén (như MediaBin, đợt 41 W3).
 */
export async function openArchiveFileFlow(
  file: File,
  onImportProgress?: (ev: ImportFileProgressEvent) => void,
): Promise<boolean> {
  const res = await importArchive(file);
  if (!res.ok || !res.spec) {
    pushToast(t("projectMenu.importArchiveError", { errors: res.errors.join("; ") }), "error");
    return false;
  }
  const st = useStore.getState();
  st.newProject(); // xoá project cũ (media blob URL cũ không bền vững)
  // Đợt 63 R7 — nhập archive giữ nguyên projectId trong project.json
  // của archive (archive cũ thiếu id thì parse đã migration sinh mới);
  // newProject() vừa xoay id mới nên replaceProject đè lại bằng id
  // của archive — đúng vì đây vẫn là cùng một project, chỉ đổi máy.
  st.replaceProject(res.spec, res.projectId);
  st.setProjectName(res.name);
  // Đợt 66 T7 — nhập archive cũng nhận chuỗi legacy (nợ đợt 65 S9
  // §5.2): lịch sử của file gốc trên máy cũ không đi theo `.vcut.zip`,
  // nhưng kho IndexedDB trên máy NÀY có thể còn chuỗi legacy của cùng
  // project (mở file trước đó / lưu ra từ máy này). Nhận theo cùng luật
  // hash như đường mở file; tên truyền là tên project (archive không
  // lưu tên file .vcut gốc) nên nhận chắc chắn theo hash không ảnh
  // hưởng, chỉ phân loại mơ hồ theo tên là best-effort. Mảnh mơ hồ →
  // UI nhận thủ công (LegacyHistoryAdoptModal).
  const archiveAdoptResult = await adoptLegacyHistoryChain(res.projectId, res.name, undefined, { spec: res.spec });
  queueAmbiguousFromAdoptResult(archiveAdoptResult);
  if (res.mediaFiles.length > 0) {
    await st.importFiles(res.mediaFiles, onImportProgress);
  }
  markSaved(res.spec);
  clearAutosave();
  // Đợt 59 P1: đường archive đã importFiles xong nên media đã settle —
  // mang theo manifest bin để reload sau đó giữ đủ media trong bản nén
  // (kể cả media không còn clip nào tham chiếu). Đường mở file thường
  // (openProjectFileFlow) KHÔNG truyền: lúc đó rehydrate chưa chạy xong,
  // media còn rỗng; effect autosave ở App.tsx sẽ ghi lại manifest đúng
  // sau khi restoreMediaBin (xem LIMITS đợt 59 P1 §5).
  autosave(res.spec, res.name, undefined, binMediaFromMedia(useStore.getState().media), res.projectId);
  const archiveReport = buildLoadReport(res, "archive", res.name);
  warnListReport(archiveReport);
  setLastLoadReport(archiveReport);
  return true;
}

/**
 * Q7: lưu file cũng snapshot lịch sử (best-effort, trùng hash thì tự bỏ
 * qua) — trích từ doSave của ProjectMenu, dùng chung cho đường lưu web
 * và đường lưu native.
 */
export function snapshotHistoryAfterSave(): void {
  // Đợt 64 R6 — snapshot lịch sử khóa theo projectId ổn định của
  // envelope (store.projectId), không còn khóa theo id legacy
  // (getCurrentProjectId — tên/hash file). Đổi tên project không đứt
  // chuỗi nữa; hai file trùng tên có hai chuỗi riêng.
  void getHistoryStore()
    .saveVersion(useStore.getState().projectId, useStore.getState().spec, "", t)
    .catch(() => { /* lịch sử lỗi không được làm hỏng thao tác lưu */ });
}

/**
 * Đóng gói project hiện tại thành JSON text để ghi file (đường lưu
 * native — KHÔNG tải xuống qua trình duyệt như saveProject). Caller ghi
 * xong thì gọi markCurrentProjectSaved(). structuredNotes/warnings dùng
 * để toast lưu ý y hệt đường lưu web (đợt 31 N4).
 */
export function buildNativeSavePayload(): {
  json: string;
  name: string;
  structuredNotes: StructuredNote[];
  warnings: string[];
} {
  const st = useStore.getState();
  // Đợt 63 R7 — payload native mang theo projectId ổn định (như
  // saveProject web) để file ghi ra giữ nguyên id.
  const result = serializeProject(st.spec, st.spec.meta.name, undefined, undefined, st.projectId);
  return {
    json: result.json,
    name: st.spec.meta.name,
    structuredNotes: result.structuredNotes,
    warnings: result.warnings,
  };
}

/** Đánh dấu project hiện tại "đã lưu" sau khi ghi file native thành công. */
export function markCurrentProjectSaved(): void {
  markSaved(useStore.getState().spec);
}

/** Các dòng lưu ý sau khi LƯU (đợt 31 N4) — dùng chung cho Ctrl+S web/native. */
export function saveNotesLinesForResult(result: {
  structuredNotes: StructuredNote[];
  warnings: string[];
}): string[] {
  return formatNoteLines(result.structuredNotes, result.warnings, (k, vars) => t(k, vars));
}
