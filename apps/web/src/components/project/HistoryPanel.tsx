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
  getCurrentProjectId,
  getHistoryStore,
  type ProjectVersion,
} from "../../lib/projectHistory";
import { isDirty, markSaved } from "../../lib/projectRepo";
import { pushToast } from "../../lib/toast";

function fmtTime(ms: number): string {
  const d = new Date(ms);
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const projectId = getCurrentProjectId();

  const refresh = async () => {
    try {
      setVersions(await getHistoryStore().listVersions(projectId));
    } catch (e) {
      pushToast("Không đọc được lịch sử: " + (e as Error).message, "error");
    }
  };

  useEffect(() => { void refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doSnapshot = async () => {
    setBusy(true);
    try {
      const st = useStore.getState();
      const v = await getHistoryStore().saveVersion(projectId, st.spec, label.trim());
      if (!v) {
        pushToast("Spec trùng version mới nhất — không tạo snapshot trùng.", "info");
      } else {
        pushToast(`Đã lưu phiên bản (${v.summary.join("; ")})`, "success");
        setLabel("");
      }
      await getHistoryStore().prune(projectId, HISTORY_KEEP_DEFAULT);
      await refresh();
    } catch (e) {
      pushToast("Không lưu được phiên bản: " + (e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async (v: ProjectVersion) => {
    const st = useStore.getState();
    if (isDirty(st.spec) && !window.confirm("Có thay đổi chưa lưu. Khôi phục version này sẽ thay toàn bộ project hiện tại. Tiếp tục?")) return;
    setBusy(true);
    try {
      // Snapshot trạng thái hiện tại trước khi ghi đè — khôi phục không mất dữ liệu.
      await getHistoryStore().saveVersion(projectId, st.spec, "trước khi khôi phục");
      const spec = await getHistoryStore().restoreVersion(v.id);
      if (!spec) { pushToast("Không tìm thấy version này nữa.", "error"); return; }
      st.replaceProject(spec);
      st.setProjectName(spec.meta.name);
      markSaved(spec);
      pushToast(`Đã khôi phục phiên bản ${fmtTime(v.createdAt)}${v.label ? ` (${v.label})` : ""}`, "success");
      await refresh();
    } catch (e) {
      pushToast("Không khôi phục được: " + (e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (v: ProjectVersion) => {
    if (!window.confirm(`Xoá phiên bản ${fmtTime(v.createdAt)}? Không khôi phục được.`)) return;
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
      const n = await getHistoryStore().importHistory(data);
      pushToast(`Đã nhập ${n} version mới (bỏ qua version đã có).`, "success");
      await refresh();
    } catch (err) {
      pushToast("Không nhập được: " + (err as Error).message, "error");
    }
  };

  return (
    <div className="history-panel" style={{ border: "1px solid #444", padding: 12, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>🕘 Lịch sử phiên bản (lưu local, chưa đồng bộ cloud)</strong>
        <button onClick={onClose}>✕</button>
      </div>
      <p style={{ color: "#aaa", fontSize: 13 }}>
        Snapshot lưu toàn bộ spec vào IndexedDB trên máy này. Tối đa {HISTORY_KEEP_DEFAULT} version/project;
        muốn mang đi máy khác thì Xuất file lịch sử.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Nhãn cho snapshot (không bắt buộc)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="primary" onClick={() => void doSnapshot()} disabled={busy}>📸 Lưu phiên bản</button>
        <button onClick={() => void doExport()}>⬇ Xuất lịch sử</button>
        <label style={{ border: "1px solid #666", padding: "4px 10px", cursor: "pointer" }}>
          ⬆ Nhập lịch sử
          <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={(e) => void onImportFile(e)} />
        </label>
      </div>
      {versions.length === 0 ? (
        <p style={{ color: "#aaa" }}>Chưa có phiên bản nào. Bấm “Lưu phiên bản” để tạo snapshot đầu tiên.</p>
      ) : (
        <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
          <thead><tr><th style={{ textAlign: "left" }}>Thời gian</th><th style={{ textAlign: "left" }}>Nhãn</th><th style={{ textAlign: "left" }}>Thay đổi</th><th /></tr></thead>
          <tbody>
            {[...versions].reverse().map((v) => (
              <tr key={v.id}>
                <td>{fmtTime(v.createdAt)}</td>
                <td>{v.label || "—"}</td>
                <td>{v.summary.join("; ")}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button onClick={() => void doRestore(v)} disabled={busy}>↩ Khôi phục</button>{" "}
                  <button onClick={() => void doDelete(v)} disabled={busy}>🗑 Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
