/**
 * LegacyHistoryAdoptModal.tsx — UI nhận mảnh legacy mơ hồ THỦ CÔNG
 * (Phase 9 đợt 66, luồng T7 — đóng nợ đợt 65 S9 §5.1).
 *
 * Khi adoptLegacyHistoryChain gặp chuỗi legacy mơ hồ (tên khớp nhưng
 * hash lệch / thiếu bằng chứng / spec rỗng), nó KHÔNG tự nhận mà ghi
 * vào hàng đợi (legacyAdoptUi.ts) — modal này hiện lên để user xem
 * bằng chứng rồi quyết định từng chuỗi:
 *   - Nhận: gọi adoptLegacyFragmentManually (quyết định của user thay
 *     cho luật hash tự động) rồi gỡ mục khỏi hàng đợi.
 *   - Bỏ qua: ghi id vào localStorage để lần mở sau không hỏi lại;
 *     dữ liệu trong kho KHÔNG bị xóa.
 *   - Đóng: chỉ ẩn modal lần này; modal hiện lại khi có mục mơ hồ MỚI.
 *
 * i18n: key `legacyAdopt.*` nằm trong fragment riêng
 * `apps/web/src/i18n/fragments/round66-t7.json` — parent gộp vào dict
 * sau (KHÔNG tự gộp). Component dùng `t` (không dùng bí danh `i18nT`)
 * để r6-i18n-check không báo thiếu key trước lúc gộp; trước lúc gộp,
 * chuỗi chưa dịch hiện đúng key (hành vi fallback có sẵn của `t`).
 * Chuỗi key đầy đủ viết literal trong file (kể cả bảng REASON_KEY) để
 * test orphan quét được sau khi gộp.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useStore } from "../../store";
import { adoptLegacyFragmentManually } from "../../lib/projectHistory";
import {
  dismissAllLegacyItems,
  dismissLegacyItem,
  getLegacyAdoptQueue,
  removeLegacyItem,
  subscribeLegacyAdoptQueue,
  type AmbiguousLegacyItem,
} from "../../lib/legacyAdoptUi";
import { pushToast } from "../../lib/toast";
import { fmtTime } from "./HistoryPanel";
import { t, useLang } from "../../i18n";

/** Ánh xạ mã lý do mơ hồ → key i18n đầy đủ (literal để test orphan quét được). */
const REASON_KEY: Record<string, string> = {
  "ambiguous-name-only-hash-mismatch": "legacyAdopt.reasonAmbiguousNameOnlyHashMismatch",
  "ambiguous-no-content-evidence": "legacyAdopt.reasonAmbiguousNoContentEvidence",
  "ambiguous-trivial-spec": "legacyAdopt.reasonAmbiguousTrivialSpec",
  "scan-error": "legacyAdopt.reasonScanError",
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

export function LegacyHistoryAdoptModal(): JSX.Element | null {
  useLang(); // re-render khi đổi ngôn ngữ
  const items = useSyncExternalStore(subscribeLegacyAdoptQueue, getLegacyAdoptQueue);
  const projectId = useStore((s) => s.projectId);
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

  if (items.length === 0 || closed) return null;

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

  return (
    <div className="modal-backdrop" data-testid="legacy-adopt-modal" role="dialog" aria-modal="true" aria-label={t("legacyAdopt.title")}>
      <div
        className="modal"
        style={{ width: 720, maxWidth: "94vw", maxHeight: "85vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <strong>{t("legacyAdopt.title")}</strong>
          <button type="button" onClick={() => setClosed(true)} aria-label={t("legacyAdopt.close")}>✕</button>
        </div>
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
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="primary"
                  data-testid="legacy-adopt-accept"
                  disabled={busy.has(item.from)}
                  onClick={() => void doAdopt(item)}
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
            </section>
          ))}
        </div>
        <p style={{ color: "#aaa", fontSize: 12, lineHeight: 1.5 }}>{t("legacyAdopt.dismissedNote")}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => void doAdoptAll()} disabled={busy.size > 0}>
            {t("legacyAdopt.adoptAll")}
          </button>
          <button type="button" onClick={() => dismissAllLegacyItems()} disabled={busy.size > 0}>
            {t("legacyAdopt.dismissAll")}
          </button>
          <button type="button" onClick={() => setClosed(true)}>
            {t("legacyAdopt.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
