/**
 * LegacyHistoryAdoptModal.tsx — UI nhận mảnh legacy mơ hồ THỦ CÔNG
 * (Phase 9 đợt 66, luồng T7 — đóng nợ đợt 65 S9 §5.1).
 *
 * Khi adoptLegacyHistoryChain gặp chuỗi legacy mơ hồ (tên khớp nhưng
 * hash lệch / thiếu bằng chứng / spec rỗng), nó KHÔNG tự nhận mà ghi
 * vào hàng đợi (legacyAdoptUi.ts) — modal này hiện lên để user xem
 * bằng chứng rồi quyết định từng chuỗi:
 *   - Nhận: xác nhận lần 2 (tóm tắt mảnh sẽ nhận) rồi mới gọi
 *     adoptLegacyFragmentManually (quyết định của user thay cho luật
 *     hash tự động), gỡ mục khỏi hàng đợi; sau khi nhận có nút Hoàn
 *     tác trả version về chuỗi gốc — NHIỀU MỨC theo stack LIFO, tối
 *     đa 20 mức (đợt 68 V6; đợt 67 U6 chỉ một mức).
 *   - Bỏ qua: ghi id vào localStorage để lần mở sau không hỏi lại;
 *     dữ liệu trong kho KHÔNG bị xóa. Mục đã bỏ qua xem/mở lại được
 *     ở mục "Các chuỗi đã bỏ qua" trong chính modal này (đợt 67 U6)
 *     hoặc nút trong HistoryPanel.
 *   - Đóng: chỉ ẩn modal lần này; modal hiện lại khi có mục mơ hồ MỚI.
 *
 * i18n: key `legacyAdopt.*` nằm trong fragment riêng
 * `apps/web/src/i18n/fragments/round66-t7.json` (đợt 66 T7) +
 * `apps/web/src/i18n/fragments/round67-u6.json` (đợt 67 U6 — xác nhận
 * lần 2 / hoàn tác / mở lại) +
 * `apps/web/src/i18n/fragments/round68-v6.json` (đợt 68 V6 — stack
 * hoàn tác nhiều mức: undoDepth / undoStackFull / confirmAllBodyMulti
 * / undoEnvelopeMismatch) — parent gộp vào dict sau (KHÔNG tự
 * gộp). Lưu ý: câu xác nhận cũ của đợt 67 U6 (chỉ hoàn tác được lần
 * nhận gần nhất) nay KHÔNG còn dùng nữa — modal dùng câu mới cho hoàn
 * tác nhiều mức vì câu cũ đã sai sau đợt này (chuỗi cũ đã xóa khỏi
 * dict đợt 69 W3, chỉ còn trong fragment lịch sử round67-u6 — xem
 * LIMITS đợt 68 V6 §5). Component dùng `t` (không dùng bí
 * danh `i18nT`) nên r6-i18n-check không báo thiếu key trước lúc gộp;
 * trước lúc gộp, chuỗi chưa dịch hiện đúng key (hành vi fallback có
 * sẵn của `t`).
 * Chuỗi key đầy đủ viết literal trong file (kể cả bảng REASON_KEY) để
 * test orphan quét được sau khi gộp.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useStore } from "../../store";
import {
  LEGACY_ADOPT_UNDO_MAX_LEVELS,
  LegacyAdoptUndoStack,
  adoptLegacyFragmentManually,
  getHistoryStore,
  makeManualAdoptRecord,
  notifyHistoryChanged,
  readLegacyHistoryProjectId,
  undoLastManualAdopt,
} from "../../lib/projectHistory";
import {
  clearLegacyAdoptModalRequest,
  getDismissedLegacyIdsSnapshot,
  getLegacyAdoptModalRequested,
  loadDismissedLegacyItems,
  queueAmbiguousLegacyItems,
  dismissAllLegacyItems,
  dismissLegacyItem,
  getLegacyAdoptQueue,
  removeLegacyItem,
  subscribeDismissedLegacyIds,
  subscribeLegacyAdoptQueue,
  subscribeLegacyAdoptModalRequest,
  undismissLegacyId,
  type AmbiguousLegacyItem,
  type DismissedLegacyChain,
} from "../../lib/legacyAdoptUi";
import { pushToast } from "../../lib/toast";
import { specHash } from "../../lib/projectRepo";
import { fmtTime } from "./HistoryPanel";
import { t, useLang } from "../../i18n";

/** Ánh xạ mã lý do mơ hồ → key i18n đầy đủ (literal để test orphan quét được). */
const REASON_KEY: Record<string, string> = {
  "ambiguous-name-only-hash-mismatch": "legacyAdopt.reasonAmbiguousNameOnlyHashMismatch",
  "ambiguous-no-content-evidence": "legacyAdopt.reasonAmbiguousNoContentEvidence",
  "ambiguous-trivial-spec": "legacyAdopt.reasonAmbiguousTrivialSpec",
  "scan-error": "legacyAdopt.reasonScanError",
  // Đợt 67 U6 — mục đã bỏ qua trước đó (hiện ở mục mở lại).
  dismissed: "legacyAdopt.reasonDismissed",
};

function reasonText(reason: string): string {
  const key = REASON_KEY[reason];
  return key ? t(key) : reason;
}

function EvidenceRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
      <span style={{ color: "#aaa", minWidth: 150, flexShrink: 0 }}>{label}</span>
      <span style={{ wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

/**
 * Đợt 68 V6 — STACK HOÀN TÁC NHIỀU MỨC (thay bản ghi một mức của đợt
 * 67 U6): mỗi lần nhận push một `ManualAdoptRecord` lên stack (giữ
 * trong ref, số mức hiện trong state `undoDepth` để re-render);
 * hoàn tác pop từng mức theo thứ tự ngược. Map `undoItemsRef` giữ
 * item gốc của từng mức để hoàn tác trả mục về hàng đợi — một chuỗi
 * chỉ có tối đa một mức đang sống trong stack (hàng đợi khử trùng
 * theo `from`) nên map theo `fragmentId` là đủ. Đổi project thì dọn
 * sạch stack (bản ghi gắn với envelope cũ, không hoàn tác sang
 * project khác được).
 */

export function LegacyHistoryAdoptModal(): JSX.Element | null {
  useLang(); // re-render khi đổi ngôn ngữ
  const items = useSyncExternalStore(subscribeLegacyAdoptQueue, getLegacyAdoptQueue);
  const openRequested = useSyncExternalStore(subscribeLegacyAdoptModalRequest, getLegacyAdoptModalRequested);
  const dismissedCount = useSyncExternalStore(subscribeDismissedLegacyIds, getDismissedLegacyIdsSnapshot).length;
  const projectId = useStore((s) => s.projectId);
  const spec = useStore((s) => s.spec);
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  // "Đóng" chỉ ẩn modal lần này; hiện lại khi hàng đợi có mục MỚI.
  const [closed, setClosed] = useState(false);
  const seenKeyRef = useRef("");
  const queueKey = items.map((i) => i.from).join("\n");
  useEffect(() => {
    if (queueKey !== seenKeyRef.current) {
      seenKeyRef.current = queueKey;
      setClosed(false);
    }
  }, [queueKey]);
  // Đợt 67 U6 — xác nhận lần 2 + hoàn tác + mở lại mục đã bỏ qua.
  // Đợt 68 V6 — hoàn tác nhiều mức: stack trong ref + số mức trong
  // state (để re-render); map fragmentId → item gốc để trả mục về
  // hàng đợi khi hoàn tác.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const undoStackRef = useRef(new LegacyAdoptUndoStack());
  const [undoDepth, setUndoDepth] = useState(0);
  const undoItemsRef = useRef(new Map<string, AmbiguousLegacyItem>());
  const [undoBusy, setUndoBusy] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [dismissedLoading, setDismissedLoading] = useState(false);
  const [dismissedChains, setDismissedChains] = useState<DismissedLegacyChain[] | null>(null);

  const refreshDismissed = useCallback(async (): Promise<void> => {
    setDismissedLoading(true);
    try {
      const chains = await loadDismissedLegacyItems(
        getHistoryStore(),
        specHash(spec),
        readLegacyHistoryProjectId(),
      );
      setDismissedChains(chains);
    } catch {
      setDismissedChains([]);
    } finally {
      setDismissedLoading(false);
    }
  }, [spec]);

  useEffect(() => {
    if (showDismissed) void refreshDismissed();
  }, [showDismissed, refreshDismissed]);

  // Yêu cầu mở từ HistoryPanel (xem lại mục đã bỏ qua): hiện modal
  // ngay cả khi hàng đợi đang rỗng + mở sẵn mục đã bỏ qua.
  useEffect(() => {
    if (openRequested) {
      setClosed(false);
      setShowDismissed(true);
    }
  }, [openRequested]);

  // Đợt 68 V6 — bản ghi hoàn tác gắn với envelope lúc nhận: đổi
  // project thì dọn sạch stack (không hoàn tác sang project khác).
  // Chạy cả lần mount đầu (stack khi đó đang rỗng nên không đổi gì).
  useEffect(() => {
    undoStackRef.current.clear();
    undoItemsRef.current.clear();
    setUndoDepth(0);
  }, [projectId]);

  if (items.length === 0 && undoDepth === 0 && !openRequested && !showDismissed) return null;
  if (closed) return null;

  const handleClose = (): void => {
    setClosed(true);
    setShowDismissed(false);
    setConfirming(null);
    setConfirmingAll(false);
    clearLegacyAdoptModalRequest();
  };

  const setItemBusy = (from: string, on: boolean): void => {
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(from);
      else next.delete(from);
      return next;
    });
  };

  const doAdopt = async (item: AmbiguousLegacyItem): Promise<void> => {
    if (busy.has(item.from)) return;
    setItemBusy(item.from, true);
    try {
      const r = await adoptLegacyFragmentManually(projectId, item.from);
      if (r.reason === "error") {
        pushToast(t("legacyAdopt.adoptFailed", { from: item.from, error: r.error ?? r.reason }), "error");
        return;
      }
      removeLegacyItem(item.from);
      // Đợt 68 V6 — push một mức hoàn tác lên stack (nhiều mức,
      // LIFO). Chỉ push khi lần nhận này có gì để hoàn tác: có
      // version đã chuyển, hoặc chuỗi là con trỏ (undo khôi phục
      // khóa). Nhận chuỗi rỗng không phải con trỏ thì không có gì
      // để trả — không push mức rỗng. Vượt 20 mức thì mức cũ nhất
      // bị bỏ — báo cho user bằng toast (không lặng lẽ).
      if (r.moved > 0 || r.wasPointerChain) {
        const { dropped } = undoStackRef.current.push(makeManualAdoptRecord(projectId, item.from, r));
        undoItemsRef.current.set(item.from, item);
        setUndoDepth(undoStackRef.current.size);
        if (dropped) {
          pushToast(
            t("legacyAdopt.undoStackFull", { max: String(LEGACY_ADOPT_UNDO_MAX_LEVELS) }),
            "info",
          );
        }
      }
      // Kho đổi thật thì báo HistoryPanel đang mở đọc lại.
      if (r.moved > 0) notifyHistoryChanged();
      pushToast(t("legacyAdopt.adopted", { n: String(r.moved), from: item.from }), "success");
    } finally {
      setItemBusy(item.from, false);
    }
  };

  const doAdoptAll = async (): Promise<void> => {
    for (const item of [...items]) {
      if (busy.has(item.from)) continue;
      await doAdopt(item);
    }
  };

  const doUndo = async (): Promise<void> => {
    if (undoDepth === 0 || undoBusy) return;
    setUndoBusy(true);
    try {
      // Đợt 68 V6 — pop MỨC GẦN NHẤT khỏi stack (LIFO): nhận "tất
      // cả" 3 chuỗi rồi bấm Hoàn tác 3 lần sẽ trả về đúng 3 chuỗi
      // theo thứ tự ngược với lúc nhận.
      const popped = await undoLastManualAdopt(undoStackRef.current, projectId);
      setUndoDepth(undoStackRef.current.size);
      if (!popped) {
        pushToast(t("legacyAdopt.undoNothing"), "info");
        return;
      }
      const { record, result: r } = popped;
      if (r.reason === "error") {
        // Lỗi kho: đẩy bản ghi TRỞ LẠI đỉnh stack để user bấm Hoàn
        // tác thử lại sau (không mất mức); mục không về hàng đợi.
        undoStackRef.current.push(record);
        setUndoDepth(undoStackRef.current.size);
        pushToast(t("legacyAdopt.undoFailed", { from: record.fragmentId, error: r.error ?? r.reason }), "error");
        return;
      }
      if (r.reason === "envelope-mismatch") {
        // Phiên hoàn tác đã cũ (project đổi giữa chừng — helper đã
        // đẩy bản ghi trở lại stack): dọn sạch stack, báo rõ.
        undoStackRef.current.clear();
        undoItemsRef.current.clear();
        setUndoDepth(0);
        pushToast(t("legacyAdopt.undoEnvelopeMismatch"), "error");
        return;
      }
      if (r.reason === "nothing-to-undo") {
        // Bản ghi đã pop (đã dùng): version đã bị xóa/prune sau khi
        // nhận nên không còn gì để trả. Mục không về hàng đợi (chuỗi
        // đã rỗng) — đúng hành vi đợt 67 U6 với mức duy nhất.
        undoItemsRef.current.delete(record.fragmentId);
        pushToast(t("legacyAdopt.undoNothing"), "info");
        return;
      }
      // Trả mục về hàng đợi chờ quyết định lại (khóa con trỏ đã khôi
      // phục nếu có). Item lấy từ map theo fragmentId của bản ghi.
      const item = undoItemsRef.current.get(record.fragmentId);
      undoItemsRef.current.delete(record.fragmentId);
      if (item) queueAmbiguousLegacyItems([item]);
      // Kho đổi thật thì báo HistoryPanel đang mở đọc lại.
      if (r.movedBack > 0) notifyHistoryChanged();
      pushToast(
        t(r.reason === "undone-empty" ? "legacyAdopt.undoEmpty" : "legacyAdopt.undoDone", {
          n: String(r.movedBack),
          from: record.fragmentId,
        }),
        "success",
      );
    } finally {
      setUndoBusy(false);
    }
  };

  const doReopen = async (chain: DismissedLegacyChain): Promise<void> => {
    undismissLegacyId(chain.from);
    queueAmbiguousLegacyItems([chain]);
    pushToast(t("legacyAdopt.reopenDone", { from: chain.from }), "success");
    await refreshDismissed();
  };

  const doForget = async (chain: DismissedLegacyChain): Promise<void> => {
    // Chỉ gỡ khỏi danh sách "đã bỏ qua" — dữ liệu trong kho không đổi;
    // lần adopt/quét sau có thể hỏi lại chuỗi này nếu còn mơ hồ.
    undismissLegacyId(chain.from);
    await refreshDismissed();
  };

  const totalPendingVersions = items.reduce((sum, i) => sum + i.versionCount, 0);
  // Đợt 68 V6 — mức trên đỉnh stack = lần nhận gần nhất = lần hoàn
  // tác tới sẽ khôi phục. Banner hiện rõ số mức còn lại (data-depth
  // để headed test assert số, không assert chuỗi dịch trước lúc gộp).
  const topAdopt = undoStackRef.current.peek();

  return (
    <div className="modal-backdrop" data-testid="legacy-adopt-modal" role="dialog" aria-modal="true" aria-label={t("legacyAdopt.title")}>
      <div
        className="modal"
        style={{ width: 720, maxWidth: "94vw", maxHeight: "85vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <strong>{t("legacyAdopt.title")}</strong>
          <button type="button" data-testid="legacy-adopt-close" onClick={handleClose} aria-label={t("legacyAdopt.close")}>✕</button>
        </div>
        {undoDepth > 0 && topAdopt && (
          <div
            data-testid="legacy-adopt-last-adopt"
            data-depth={undoDepth}
            style={{ border: "1px solid var(--border-soft)", borderRadius: 8, padding: 10, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 13 }}>
              {t("legacyAdopt.undoBanner", { n: String(topAdopt.moved), from: topAdopt.fragmentId })}{" "}
              {t("legacyAdopt.undoDepth", { depth: String(undoDepth) })}
            </span>
            <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button type="button" data-testid="legacy-adopt-undo" disabled={undoBusy} onClick={() => void doUndo()}>
                {t("legacyAdopt.undo")}
              </button>
              <button
                type="button"
                data-testid="legacy-adopt-undo-hide"
                onClick={() => {
                  // Đợt 68 V6 — Ẩn = bỏ TOÀN BỘ các mức hoàn tác còn
                  // lại (không chỉ mức trên đỉnh): banner là UI duy
                  // nhất để hoàn tác, ẩn banner thì không còn đường
                  // hoàn tác các mức đó nữa.
                  undoStackRef.current.clear();
                  undoItemsRef.current.clear();
                  setUndoDepth(0);
                }}
              >
                {t("legacyAdopt.undoHide")}
              </button>
            </span>
          </div>
        )}
        {items.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.5 }}>{t("legacyAdopt.noPending")}</p>
        ) : (
          <>
            <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.5 }}>
              {t("legacyAdopt.intro", { n: String(items.length) })}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((item) => (
                <section
                  key={item.from}
                  data-testid="legacy-adopt-item"
                  data-from={item.from}
                  style={{ border: "1px solid var(--border-soft)", borderRadius: 8, padding: 12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                      <EvidenceRow label={t("legacyAdopt.source")} value={item.from} />
                      <EvidenceRow
                        label={t("legacyAdopt.kind")}
                        value={t(item.isPointerChain ? "legacyAdopt.pointerChain" : "legacyAdopt.fragmentChain")}
                      />
                      <EvidenceRow label={t("legacyAdopt.name")} value={item.namePart || t("legacyAdopt.noName")} />
                      <EvidenceRow label={t("legacyAdopt.embeddedHash")} value={item.embeddedHash ?? t("legacyAdopt.noHash")} />
                      <EvidenceRow label={t("legacyAdopt.openedHash")} value={item.openedSpecHash ?? t("legacyAdopt.noHash")} />
                      <EvidenceRow label={t("legacyAdopt.versions")} value={String(item.versionCount)} />
                      <EvidenceRow
                        label={t("legacyAdopt.firstVersion")}
                        value={item.firstCreatedAt !== null ? fmtTime(item.firstCreatedAt) : t("legacyAdopt.noHash")}
                      />
                      <EvidenceRow
                        label={t("legacyAdopt.lastVersion")}
                        value={item.lastCreatedAt !== null ? fmtTime(item.lastCreatedAt) : t("legacyAdopt.noHash")}
                      />
                      <EvidenceRow label={t("legacyAdopt.reason")} value={reasonText(item.reason)} />
                    </div>
                  </div>
                  {confirming === item.from ? (
                    <div
                      data-testid="legacy-adopt-confirm"
                      data-from={item.from}
                      style={{ border: "1px dashed var(--border-soft)", borderRadius: 8, padding: 10, marginTop: 10 }}
                    >
                      <strong style={{ fontSize: 13 }}>{t("legacyAdopt.confirmTitle")}</strong>
                      <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.5, margin: "6px 0 10px" }}>
                        {t("legacyAdopt.confirmBody", { n: String(item.versionCount), from: item.from })}
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="primary"
                          data-testid="legacy-adopt-confirm-accept"
                          disabled={busy.has(item.from)}
                          onClick={() => {
                            setConfirming(null);
                            void doAdopt(item);
                          }}
                        >
                          {t("legacyAdopt.confirmAdopt")}
                        </button>
                        <button type="button" data-testid="legacy-adopt-confirm-cancel" onClick={() => setConfirming(null)}>
                          {t("legacyAdopt.confirmCancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        className="primary"
                        data-testid="legacy-adopt-accept"
                        disabled={busy.has(item.from)}
                        onClick={() => setConfirming(item.from)}
                      >
                        {t("legacyAdopt.adopt")}
                      </button>
                      <button
                        type="button"
                        data-testid="legacy-adopt-dismiss"
                        disabled={busy.has(item.from)}
                        onClick={() => dismissLegacyItem(item.from)}
                      >
                        {t("legacyAdopt.dismiss")}
                      </button>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
        <p style={{ color: "#aaa", fontSize: 12, lineHeight: 1.5 }}>{t("legacyAdopt.dismissedNote")}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {items.length > 0 && (
            <button type="button" onClick={() => setConfirmingAll(true)} disabled={busy.size > 0}>
              {t("legacyAdopt.adoptAll")}
            </button>
          )}
          {items.length > 0 && (
            <button type="button" onClick={() => dismissAllLegacyItems()} disabled={busy.size > 0}>
              {t("legacyAdopt.dismissAll")}
            </button>
          )}
          <button type="button" onClick={handleClose}>
            {t("legacyAdopt.close")}
          </button>
        </div>
        {confirmingAll && items.length > 0 && (
          <div
            data-testid="legacy-adopt-confirm-all"
            style={{ border: "1px dashed var(--border-soft)", borderRadius: 8, padding: 10, marginTop: 10 }}
          >
            <strong style={{ fontSize: 13 }}>{t("legacyAdopt.confirmAllTitle")}</strong>
            <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.5, margin: "6px 0 10px" }}>
              {t("legacyAdopt.confirmAllBodyMulti", { n: String(totalPendingVersions), m: String(items.length) })}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="primary"
                data-testid="legacy-adopt-confirm-all-accept"
                disabled={busy.size > 0}
                onClick={() => {
                  setConfirmingAll(false);
                  void doAdoptAll();
                }}
              >
                {t("legacyAdopt.confirmAdopt")}
              </button>
              <button type="button" data-testid="legacy-adopt-confirm-all-cancel" onClick={() => setConfirmingAll(false)}>
                {t("legacyAdopt.confirmCancel")}
              </button>
            </div>
          </div>
        )}
        <div style={{ borderTop: "1px solid var(--border-soft)", marginTop: 14, paddingTop: 10 }}>
          <button
            type="button"
            data-testid="legacy-adopt-dismissed-toggle"
            onClick={() => setShowDismissed((v) => !v)}
          >
            {showDismissed ? t("legacyAdopt.dismissedHide") : `${t("legacyAdopt.dismissedShow")} (${dismissedCount})`}
          </button>
          {showDismissed && (
            <div data-testid="legacy-adopt-dismissed-section" style={{ marginTop: 10 }}>
              <strong style={{ fontSize: 13 }}>{t("legacyAdopt.dismissedTitle")}</strong>
              {dismissedLoading || dismissedChains === null ? (
                <p style={{ color: "#aaa", fontSize: 13 }}>{t("legacyAdopt.dismissedLoading")}</p>
              ) : dismissedChains.length === 0 ? (
                <p style={{ color: "#aaa", fontSize: 13 }}>{t("legacyAdopt.dismissedEmpty")}</p>
              ) : (
                <div data-testid="legacy-adopt-dismissed-list" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {dismissedChains.map((chain) => (
                    <section
                      key={chain.from}
                      data-testid="legacy-adopt-dismissed-item"
                      data-from={chain.from}
                      style={{ border: "1px solid var(--border-soft)", borderRadius: 8, padding: 10 }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                        <EvidenceRow label={t("legacyAdopt.source")} value={chain.from} />
                        <EvidenceRow label={t("legacyAdopt.name")} value={chain.namePart || t("legacyAdopt.noName")} />
                        <EvidenceRow label={t("legacyAdopt.embeddedHash")} value={chain.embeddedHash ?? t("legacyAdopt.noHash")} />
                        <EvidenceRow label={t("legacyAdopt.versions")} value={String(chain.versionCount)} />
                        <EvidenceRow
                          label={t("legacyAdopt.firstVersion")}
                          value={chain.firstCreatedAt !== null ? fmtTime(chain.firstCreatedAt) : t("legacyAdopt.noHash")}
                        />
                        <EvidenceRow
                          label={t("legacyAdopt.lastVersion")}
                          value={chain.lastCreatedAt !== null ? fmtTime(chain.lastCreatedAt) : t("legacyAdopt.noHash")}
                        />
                        <EvidenceRow label={t("legacyAdopt.reason")} value={reasonText(chain.reason)} />
                        {!chain.exists && (
                          <p style={{ color: "#c66", fontSize: 13, margin: "4px 0 0" }}>{t("legacyAdopt.dismissedGone")}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {chain.exists && (
                          <button
                            type="button"
                            className="primary"
                            data-testid="legacy-adopt-reopen"
                            onClick={() => void doReopen(chain)}
                          >
                            {t("legacyAdopt.reopen")}
                          </button>
                        )}
                        <button type="button" data-testid="legacy-adopt-forget" onClick={() => void doForget(chain)}>
                          {t("legacyAdopt.forgetDismissed")}
                        </button>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
