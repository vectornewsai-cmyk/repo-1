/**
 * HistoryPanel — Xem / khôi phục / xoá / xuất-nhập lịch sử phiên bản project.
 *
 * Lưu LOCAL (IndexedDB). Chưa có đồng bộ cloud — xem Q7_LIMITS.md.
 * Khôi phục sẽ thay toàn bộ spec hiện tại (hỏi xác nhận trước nếu có thay
 * đổi chưa lưu), và version hiện tại trước khi khôi phục được snapshot tự
 * động để không mất dữ liệu.
 */
import { useEffect, useState } from "react";
import { useStore } from "../../store";
import {
  HISTORY_KEEP_DEFAULT,
  getHistoryStore,
  type ProjectVersion,
} from "../../lib/projectHistory";
import { collectSpeedCurveWarnings, isDirty, markSaved } from "../../lib/projectRepo";
// Phase 9 đợt 28 L4: khôi phục bypass parseProjectText nên J5 không
// chạy ở đó — quét lại spec đã khôi phục và đồng bộ báo cáo tải.
import {
  buildHistoryLoadReport,
  clearLastLoadReport,
  setLastLoadReport,
} from "../../lib/loadReport";
import { pushToast } from "../../lib/toast";
import { getLang, t, useLang } from "../../i18n";

/**
 * Ngày/giờ của version theo ngôn ngữ đang chọn — cùng pattern ProjectMenu
 * (autosave): vi → vi-VN, en → en-US. Tháng viết tắt ("7 thg 11, 2026" /
 * "Nov 7, 2026") để ngày/tháng không nhầm được: dạng số "7/11/2026" ở
 * vi-VN và "11/7/2026" ở en-US chỉ cùng một ngày nhưng đọc ngược nhau.
 * Dùng chung cho cả row trong bảng, dialog confirm xoá và toast khôi phục.
 */
export function fmtTime(ms: number): string {
  const d = new Date(ms);
  const locale = getLang() === "vi" ? "vi-VN" : "en-US";
  const date = d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  useLang(); // re-render khi đổi ngôn ngữ
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  // Đợt 64 R6 — lịch sử khóa theo projectId ổn định của envelope
  // (store.projectId), không còn khóa theo id legacy gắn với tên file
  // (getCurrentProjectId): đổi tên project không đứt chuỗi; hai file
  // trùng tên có hai chuỗi riêng. Đăng ký store để mở project khác thì
  // panel liệt kê lại đúng chuỗi mới.
  const projectId = useStore((s) => s.projectId);

  const refresh = async () => {
    try {
      setVersions(await getHistoryStore(t).listVersions(projectId));
    } catch (e) {
      pushToast(t("history.readFailed", { error: (e as Error).message }), "error");
    }
  };

  useEffect(() => { void refresh(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSnapshot = async () => {
    setBusy(true);
    try {
      const st = useStore.getState();
      const v = await getHistoryStore().saveVersion(projectId, st.spec, label.trim(), t);
      if (!v) {
        pushToast(t("history.duplicate"), "info");
      } else {
        pushToast(t("history.saved", { summary: v.summary.join("; ") }), "success");
        setLabel("");
      }
      await getHistoryStore().prune(projectId, HISTORY_KEEP_DEFAULT);
      await refresh();
    } catch (e) {
      pushToast(t("history.saveFailed", { error: (e as Error).message }), "error");
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async (v: ProjectVersion) => {
    const st = useStore.getState();
    if (isDirty(st.spec) && !window.confirm(t("history.restoreConfirm"))) return;
    setBusy(true);
    try {
      // Snapshot trạng thái hiện tại trước khi ghi đè — khôi phục không mất dữ liệu.
      await getHistoryStore().saveVersion(projectId, st.spec, t("history.beforeRestore"), t);
      const spec = await getHistoryStore().restoreVersion(v.id);
      if (!spec) { pushToast(t("history.notFound"), "error"); return; }
      // Đợt 63 R7 — khôi phục version là cùng một project nên GIỮ
      // projectId hiện tại (không sinh id mới: version cũ vẫn thuộc
      // project này, sổ tham chiếu của nó phải ở lại cùng khóa).
      st.replaceProject(spec, useStore.getState().projectId);
      st.setProjectName(spec.meta.name);
      markSaved(spec);
      // Đợt 28 L4: đồng bộ báo cáo tải với spec vừa khôi phục — có vi
      // phạm thì set báo cáo mới (nguồn "history", strip/panel ở App tự
      // hiện qua subscribe), không còn vi phạm thì xoá báo cáo cũ để
      // strip không chỉ vào project đã bị thay thế.
      const restoredWarnings = collectSpeedCurveWarnings(spec);
      if (restoredWarnings.length > 0) {
        setLastLoadReport(buildHistoryLoadReport(restoredWarnings, spec.meta.name));
      } else {
        clearLastLoadReport();
      }
      pushToast(t("history.restored", { time: fmtTime(v.createdAt), label: v.label ? ` (${v.label})` : "" }), "success");
      await refresh();
    } catch (e) {
      pushToast(t("history.restoreFailed", { error: (e as Error).message }), "error");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (v: ProjectVersion) => {
    if (!window.confirm(t("history.deleteConfirm", { time: fmtTime(v.createdAt) }))) return;
    await getHistoryStore().deleteVersion(v.id);
    await refresh();
  };

  const doExport = async () => {
    const store = getHistoryStore();
    const list = await store.listVersions(projectId);
    const data = store.exportHistory(projectId, list);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vcut-history-${projectId.slice(0, 20)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()) as unknown;
      const n = await getHistoryStore(t).importHistory(data, t);
      pushToast(t("history.imported", { n: String(n) }), "success");
      await refresh();
    } catch (err) {
      pushToast(t("history.importFailed", { error: (err as Error).message }), "error");
    }
  };

  return (
    <div className="history-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{t("history.title")}</strong>
        <button onClick={onClose}>✕</button>
      </div>
      <p style={{ color: "#aaa", fontSize: 13 }}>
        {t("history.note", { max: String(HISTORY_KEEP_DEFAULT) })}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder={t("history.labelPlaceholder")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="primary" onClick={() => void doSnapshot()} disabled={busy}>{t("history.snapshot")}</button>
        <button onClick={() => void doExport()}>{t("history.export")}</button>
        <label style={{ border: "1px solid #666", padding: "4px 10px", cursor: "pointer" }}>
          {t("history.import")}
          <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={(e) => void onImportFile(e)} />
        </label>
      </div>
      {versions.length === 0 ? (
        <p style={{ color: "#aaa" }}>{t("history.empty")}</p>
      ) : (
        <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
          <thead><tr><th style={{ textAlign: "left" }}>{t("history.colTime")}</th><th style={{ textAlign: "left" }}>{t("history.colLabel")}</th><th style={{ textAlign: "left" }}>{t("history.colChanges")}</th><th /></tr></thead>
          <tbody>
            {[...versions].reverse().map((v) => (
              <tr key={v.id}>
                <td>{fmtTime(v.createdAt)}</td>
                <td>{v.label || "—"}</td>
                <td>{v.summary.join("; ")}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button onClick={() => void doRestore(v)} disabled={busy}>{t("history.restore")}</button>{" "}
                  <button onClick={() => void doDelete(v)} disabled={busy}>{t("topbar.deleteShort")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
