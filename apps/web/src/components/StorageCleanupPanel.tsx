/**
 * StorageCleanupPanel.tsx — UI "Dọn kho lưu trữ" (Phase 9 đợt 61, luồng R9
 * — đóng nợ đợt 60 §5.9: bytes mồ côi từ TRƯỚC đợt 60 vẫn ở lại kho).
 *
 * Liệt kê MỌI asset trong IndexedDB kèm dung lượng từng mục + trạng thái
 * tham chiếu trong project HIỆN TẠI; chỉ cho user chọn xóa những mục
 * không còn được project hiện tại tham chiếu, có xác nhận, xóa thật qua
 * AssetStore. Mục đang được dùng (bin item / clip) bị khóa không cho
 * chọn — và `deleteCleanupAsset` còn đọc tươi refCount trước khi xóa
 * nên tham chiếu xuất hiện sau lần quét vẫn chặn được.
 *
 * CẢNH BÁO AN TOÀN (quyết định Q7 §1.1 giữ nguyên): kho là TOÀN CỤC theo
 * trình duyệt — một file .vcut KHÁC có thể còn tham chiếu cùng bytes mà
 * app không có sổ nào ghi lại. "Có thể mồ côi" ở đây chỉ có nghĩa là
 * project hiện tại không tham chiếu; panel cảnh báo rõ và chỉ xóa theo
 * lựa chọn + xác nhận của user, không bao giờ tự xóa/sweep.
 *
 * Đợt 62 R7 — sổ tham chiếu liên project (đóng nợ 61 R9 §5.1): mỗi lần
 * project được lưu/mở, app ghi tập asset nó dùng vào store `projectRefs`
 * (xem AssetStore.recordProjectRefs). Panel đọc sổ ở mỗi lần quét: mục
 * nào còn được project KHÁC ghi nhận dùng thì bị khóa như mục đang dùng
 * (trạng thái "Được project khác dùng: ..."), và `deleteCleanupAssets`
 * đọc tươi sổ trước khi xóa nên tham chiếu liên project xuất hiện sau
 * lần quét vẫn chặn được (`cross-project`). Mục "Sổ tham chiếu" liệt kê
 * các project đã ghi + nút "Quên" để gỡ ghi nhận của project đã xóa
 * khỏi máy. Giới hạn trung thực (xem
 * docs/PHASE9_ROUND62_R7_IDB_XPROJECT_LIMITS.md): sổ chỉ biết các
 * project đã mở/lưu trên trình duyệt này; hai file .vcut trùng tên
 * project chung một khóa sổ; project chưa từng mở ở đây vẫn không được
 * bảo vệ — cảnh báo cũ vẫn đúng cho trường hợp đó.
 *
 * Chuỗi dùng key `storageCleanup.*` — key mới nằm ở fragment
 * hidden_files/round62-r7-fragment.json (parent gộp vào dict ở cuối đợt,
 * theo quy định luồng: không sửa trực tiếp vi.json/en.json). Trước khi
 * gộp, `t()` trả về chính key nên panel vẫn dùng được (chỉ hiện key
 * thay cho nhãn) — mọi thao tác (quét/xóa) không phụ thuộc chuỗi.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import { t, useLang } from "../i18n";
import { AssetStore } from "../lib/assetStore";
import {
  scanStorageForCleanup,
  deleteCleanupAssets,
  type CleanupScan,
} from "../lib/idbCleanup61R9";
import {
  notifyProjectRefsChanged,
  notifyStorageChanged,
  projectDisplayName,
  subscribeProjectRefsChanged,
} from "../lib/projectAssetRefs62R7";
// Đợt 63 R7 — khóa sổ tham chiếu theo projectId ổn định thay cho tên.
import { projectKeyForId } from "../lib/projectId63R7";
// Đợt 64 R6 — nhãn phân biệt tên trùng nhau trong sổ tham chiếu.
import { registryDisplayLabels } from "../lib/projectNameRegistry64R6";
import { formatBytes } from "../lib/ingestProgress39T5";
import { pushToast } from "../lib/toast";

export function StorageCleanupPanel({ onClose }: { onClose: () => void }) {
  useLang(); // re-render khi đổi ngôn ngữ
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [scan, setScan] = useState<CleanupScan | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  // Đợt 62 R7 — khóa sổ của project hiện tại (để loại bản ghi của chính
  // nó khỏi "project khác" + đánh dấu trong mục sổ tham chiếu).
  const [currentProjectKey, setCurrentProjectKey] = useState<string>("");

  const runScan = async (opts?: { keepResult?: boolean }) => {
    setPhase("loading");
    // Đợt 61 R9 — sau khi xóa, quét lại danh sách NHƯNG giữ dòng kết
    // quả (số mục đã xóa / bytes đã giải phóng) để user đọc được; quét
    // tay (nút Quét lại / mở panel) thì xóa kết quả cũ.
    if (!opts?.keepResult) setResult(null);
    try {
      const store = new AssetStore();
      const st = useStore.getState();
      // Đợt 63 R7 — khóa sổ của project hiện tại theo projectId ổn
      // định (`id:<uuid>`). Lưu ý: bản ghi legacy `name:<tên>` của
      // chính project này (ghi trước đợt 63) không trùng khóa mới nên
      // tạm hiện như "project khác" — chỉ thừa chặn (an toàn), user
      // bấm Quên để gỡ; xem LIMITS R7 đợt 63 §2.2.
      // Đợt 64 R6 — bản ghi legacy đó nay hiện kèm ngày ghi (nhãn phân
      // biệt tên trùng) nên user thấy rõ nó là bản ghi cũ, không nhầm
      // với project hiện tại; ngữ nghĩa chặn xóa giữ nguyên.
      const key = projectKeyForId(st.projectId);
      setCurrentProjectKey(key);
      const res = await scanStorageForCleanup(store, st.spec, st.media, {
        registry: store,
        currentProjectKey: key,
      });
      setScan(res);
      setSelected(new Set());
      setPhase("ready");
    } catch {
      setPhase("error");
    }
  };

  useEffect(() => {
    void runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đợt 62 R7 — tab khác vừa ghi/quên sổ hoặc xóa bytes thì quét lại
  // để panel không hiện mục đã mất / trạng thái cũ. Chỉ quét khi panel
  // đang sẵn sàng và không trong lúc xóa (tránh quét đè mất lựa chọn
  // đang tick của user).
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const deletingRef = useRef(deleting);
  deletingRef.current = deleting;
  useEffect(() => {
    const unsub = subscribeProjectRefsChanged(() => {
      if (phaseRef.current === "ready" && !deletingRef.current) {
        void runScan({ keepResult: true });
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đóng bằng Escape (cùng quy ước các modal khác trong app).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const orphans = scan?.rows.filter((r) => !r.inUse) ?? [];
  const selectedBytes = (scan?.rows ?? [])
    .filter((r) => selected.has(r.assetId))
    .reduce((s, r) => s + r.size, 0);

  // Đợt 64 R6 — nhãn hiển thị cho sổ tham chiếu: tên duy nhất giữ
  // nguyên; tên trùng nhau kèm id rút gọn (bản ghi khóa id) hoặc ngày
  // ghi (bản ghi legacy khóa tên). Tính trên TOÀN BỘ sổ (kể cả project
  // hiện tại) để tên trùng với project hiện tại vẫn được gắn qualifier.
  const registryLabels = useMemo(
    () => registryDisplayLabels(scan?.registryProjects ?? []),
    [scan],
  );

  // Project KHÁC dùng một asset, hiển thị bằng nhãn phân biệt (thay cho
  // tên thô row.usedByOther — tên thô khử trùng theo tên nên hai project
  // trùng tên chỉ hiện một mục). Lọc đúng như lib: loại project hiện
  // tại theo khóa. Rơi về tên thô khi sổ rỗng (đọc sổ lỗi).
  const otherUsersOf = (assetId: string, fallbackNames: string[]): string[] => {
    if (!scan) return fallbackNames;
    const seen = new Set<string>();
    const out: string[] = [];
    for (const rec of scan.registryProjects) {
      if (rec.projectKey === currentProjectKey) continue;
      if (!rec.assetIds.includes(assetId)) continue;
      const label = registryLabels.get(rec.projectKey) ?? rec.projectName;
      if (!seen.has(label)) {
        seen.add(label);
        out.push(label);
      }
    }
    return out.length > 0 ? out.sort() : fallbackNames;
  };

  const selectAllOrphans = () => {
    setSelected(new Set(orphans.map((r) => r.assetId)));
  };

  const toggleSelect = (assetId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0 || deleting) return;
    if (
      !window.confirm(
        t("storageCleanup.deleteConfirm", {
          count: String(selected.size),
          bytes: formatBytes(selectedBytes),
        }),
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const store = new AssetStore();
      // Đợt 62 R7 — xóa có kiểm tra sổ tham chiếu liên project: mục nào
      // còn được project khác ghi nhận dùng (hoặc đọc sổ lỗi) thì bị
      // bỏ qua, không xóa (xem deleteCleanupAsset).
      const res = await deleteCleanupAssets(store, [...selected], {
        registry: store,
        currentProjectKey,
      });
      const msg = t("storageCleanup.deletedResult", {
        count: String(res.deleted.length),
        bytes: formatBytes(res.freedBytes),
        skipped: String(res.skipped.length),
      });
      setResult(msg);
      pushToast(msg, res.skipped.length > 0 ? "info" : "success");
      if (res.deleted.length > 0) notifyStorageChanged();
      await runScan({ keepResult: true });
    } catch {
      const msg = t("storageCleanup.deleteFailed");
      setResult(msg);
      pushToast(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Đợt 62 R7 — quên một project khỏi sổ tham chiếu (file .vcut đó đã
  // xóa khỏi máy, hoặc tên project bị trùng khóa). Chỉ xóa BẢN GHI,
  // không xóa bytes; bytes chỉ mất khi user xóa ở panel sau khi quét
  // lại. Project hiện tại không cho quên (App effect sẽ ghi lại nó
  // trong ~1s nên nút bị khóa — xem JSX).
  const forgetProject = async (projectKey: string, projectName: string) => {
    if (
      !window.confirm(
        t("storageCleanup.forgetConfirm", { name: projectName }),
      )
    ) {
      return;
    }
    try {
      const store = new AssetStore();
      const ok = await store.forgetProjectRefs(projectKey);
      const msg = ok
        ? t("storageCleanup.forgotProject", { name: projectName })
        : t("storageCleanup.scanFailed");
      setResult(msg);
      pushToast(msg, ok ? "info" : "error");
      if (ok) notifyProjectRefsChanged();
      await runScan({ keepResult: true });
    } catch {
      const msg = t("storageCleanup.deleteFailed");
      setResult(msg);
      pushToast(msg, "error");
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal storage-cleanup"
        role="dialog"
        aria-label={t("storageCleanup.title")}
        data-testid="storage-cleanup-panel"
      >
        <div className="modal-head">
          <span>{t("storageCleanup.title")}</span>
          <button
            className="icon-btn"
            onClick={onClose}
            aria-label={t("storageCleanup.close")}
            data-testid="storage-cleanup-close"
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "14px 18px", overflowY: "auto", fontSize: 13 }}>
          <p style={{ margin: "0 0 10px", lineHeight: 1.5 }}>
            {t("storageCleanup.crossProjectWarning")}
          </p>
          {/* Đợt 62 R7 — sổ tham chiếu đã chặn được phần nào rủi ro
              liên project ở trên: mục nào project khác còn dùng thì bị
              khóa + hiện tên project đó. Cảnh báo cũ vẫn đúng cho
              project chưa từng mở/lưu trên trình duyệt này. */}
          <p style={{ margin: "0 0 10px", lineHeight: 1.5 }}>
            {t("storageCleanup.registryProtection")}
          </p>
          {phase === "loading" && <p>{t("storageCleanup.scanning")}</p>}
          {phase === "error" && (
            <div>
              <p style={{ color: "#ff9a9e" }}>{t("storageCleanup.scanFailed")}</p>
              <button className="mini-btn" onClick={() => void runScan()} data-testid="storage-cleanup-retry">
                {t("storageCleanup.scanAgain")}
              </button>
            </div>
          )}
          {phase === "ready" && scan && (
            <>
              <p style={{ margin: "0 0 10px" }}>
                {t("storageCleanup.summary", {
                  assets: String(scan.totalAssets),
                  bytes: formatBytes(scan.totalBytes),
                  orphans: String(scan.orphanCount),
                  orphanBytes: formatBytes(scan.orphanBytes),
                })}
              </p>
              {/* Đợt 62 R7 — mục sổ tham chiếu liên project: project nào
                  đã ghi, dùng bao nhiêu asset; nút Quên gỡ ghi nhận
                  của project đã xóa khỏi máy. Project hiện tại không
                  cho quên (App effect ghi lại nó trong ~1s). */}
              {scan.registryProjects.length > 0 && (
                <div
                  style={{ margin: "0 0 10px", padding: "8px 10px", border: "1px solid var(--border-soft)", borderRadius: 6 }}
                  data-testid="storage-cleanup-projects"
                >
                  <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
                    {t("storageCleanup.projectsTitle")}
                  </p>
                  <p style={{ margin: "0 0 8px", lineHeight: 1.5 }}>
                    {t("storageCleanup.projectsNote")}
                  </p>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {scan.registryProjects.map((rec) => {
                      const isCurrent = rec.projectKey === currentProjectKey;
                      return (
                        <li
                          key={rec.projectKey}
                          data-testid="storage-cleanup-project-row"
                          data-project-key={rec.projectKey}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}
                        >
                          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {/* Đợt 63 R7 — bản ghi khóa theo id (`id:<uuid>`)
                                thì hiện tên project trong bản ghi (hiện
                                UUID ra UI là vô nghĩa); bản ghi legacy
                                khóa theo tên vẫn hiện tên từ khóa như cũ.
                                Đợt 64 R6 — tên trùng nhau kèm qualifier
                                (id rút gọn / ngày ghi) qua registryLabels;
                                tên duy nhất giữ nguyên. */}
                            {registryLabels.get(rec.projectKey) ??
                              (rec.projectKey.startsWith("id:") ? rec.projectName : projectDisplayName(rec.projectKey))}
                            {isCurrent ? ` ${t("storageCleanup.currentProjectMark")}` : ""}
                            {" — "}
                            {t("storageCleanup.projectAssets", { count: String(rec.assetIds.length) })}
                          </span>
                          <button
                            className="mini-btn"
                            disabled={isCurrent || deleting}
                            title={isCurrent ? t("storageCleanup.currentProjectMark") : undefined}
                            onClick={() => void forgetProject(rec.projectKey, rec.projectName)}
                            data-testid="storage-cleanup-forget"
                            data-project-key={rec.projectKey}
                          >
                            {t("storageCleanup.forgetProject")}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  className="mini-btn"
                  onClick={() => void runScan()}
                  data-testid="storage-cleanup-rescan"
                >
                  {t("storageCleanup.scanAgain")}
                </button>
                <button
                  className="mini-btn"
                  onClick={selectAllOrphans}
                  disabled={orphans.length === 0}
                  data-testid="storage-cleanup-select-orphans"
                >
                  {t("storageCleanup.selectOrphans")}
                </button>
                <button
                  className="mini-btn"
                  onClick={() => void deleteSelected()}
                  disabled={selected.size === 0 || deleting}
                  data-testid="storage-cleanup-delete-selected"
                >
                  {t("storageCleanup.deleteSelected", { count: String(selected.size) })}
                </button>
              </div>
              {result && (
                <p role="status" style={{ margin: "0 0 10px" }} data-testid="storage-cleanup-result">
                  {result}
                </p>
              )}
              {scan.rows.length === 0 ? (
                <p>{t("storageCleanup.empty")}</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }} data-testid="storage-cleanup-list">
                  {scan.rows.map((row) => {
                    // Đợt 64 R6 — hiển thị project khác dùng asset này
                    // bằng nhãn phân biệt (xem otherUsersOf), không dùng
                    // tên thô row.usedByOther nữa (trùng tên bị gộp).
                    const otherUsers = otherUsersOf(row.assetId, row.usedByOther);
                    return (
                    <li
                      key={row.assetId}
                      data-testid="storage-cleanup-row"
                      data-asset-id={row.assetId}
                      data-in-use={row.inUse ? "1" : "0"}
                      data-used-by-other={otherUsers.join(" | ")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 0",
                        borderTop: "1px solid var(--border-soft)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(row.assetId)}
                        disabled={row.inUse || deleting}
                        onChange={() => toggleSelect(row.assetId)}
                        aria-label={`${t("storageCleanup.selectRow")}: ${row.name}`}
                        data-testid={`storage-cleanup-check-${row.assetId}`}
                      />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.name}
                      </span>
                      <span style={{ whiteSpace: "nowrap" }}>{formatBytes(row.size)}</span>
                      <span
                        style={{ whiteSpace: "nowrap" }}
                        data-testid={`storage-cleanup-status-${row.assetId}`}
                      >
                        {otherUsers.length > 0
                          ? t("storageCleanup.usedByOther", {
                              projects: otherUsers.join(", "),
                            })
                          : row.inUse
                            ? t("storageCleanup.inUse", {
                                bin: String(row.binItems),
                                clips: String(row.clips),
                              })
                            : t("storageCleanup.orphanCandidate")}
                      </span>
                    </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
