/**
 * RenameProjectDialog — dialog nhập tên dự án TRONG APP (Phase 9 đợt 53,
 * luồng J4 — thay window.prompt trong flow Lưu thành… trên desktop).
 *
 * Bối cảnh: renderer Electron chạy sandboxed (apps/desktop/src/main.ts
 * sandbox:true) nên window.prompt() NÉM "prompt() is not supported"
 * (bug D3 đợt 51, fix tạm đợt 52 I3 bằng try/catch bỏ qua bước đổi tên).
 * Dialog này là UI thật trong renderer: không dùng prompt/alert/confirm
 * của browser, dùng chung class modal (.modal-backdrop/.modal) với các
 * panel khác của app.
 *
 * Cách dùng: `promptProjectName(tên hiện tại)` trả về Promise:
 *   - string đã trim (kể cả "" khi nhập chuỗi trắng) → caller đổi tên
 *     nếu khác rỗng, giữ tên cũ nếu rỗng, rồi tiếp tục lưu;
 *   - null → user bấm Huỷ / Escape / click backdrop → caller huỷ flow.
 * Nếu dialog đã mở (menu bấm 2 lần), lần gọi sau trả về cùng Promise
 * đang chờ — không xếp chồng 2 dialog.
 * Nếu không có DOM (môi trường node/test), trả "" ngay — bỏ qua bước
 * đổi tên, giữ hành vi fallback của fix D3.
 */
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { t } from "../../i18n";

export function RenameProjectDialog({
  initialName,
  onDone,
}: {
  initialName: string;
  onDone: (name: string | null) => void;
}) {
  const [value, setValue] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const confirm = () => onDone(value.trim());
  const cancel = () => onDone(null);

  return (
    <div
      className="modal-backdrop"
      data-testid="rename-project-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={t("projectMenu.renameTitle")}>
        <div className="modal-head">
          <span>{t("projectMenu.renameTitle")}</span>
          <button type="button" className="icon-btn" onClick={cancel} aria-label={t("projectMenu.renameCancel")}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <label htmlFor="rename-project-input">{t("projectMenu.renameLabel")}</label>
          <input
            id="rename-project-input"
            ref={inputRef}
            data-testid="rename-project-input"
            type="text"
            value={value}
            style={{ width: "100%", padding: "8px 10px", fontSize: 14 }}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirm();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
          />
          <p className="muted small">{t("projectMenu.renameHint")}</p>
        </div>
        <div className="modal-actions">
          <button type="button" data-testid="rename-project-cancel" onClick={cancel}>
            {t("projectMenu.renameCancel")}
          </button>
          <button type="button" data-testid="rename-project-save" onClick={confirm}>
            {t("projectMenu.renameSave")}
          </button>
        </div>
      </div>
    </div>
  );
}

let pending: Promise<string | null> | null = null;

export function promptProjectName(currentName: string): Promise<string | null> {
  if (pending) return pending;
  if (typeof document === "undefined") return Promise.resolve("");
  pending = new Promise<string | null>((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let settled = false;
    const done = (name: string | null) => {
      if (settled) return;
      settled = true;
      pending = null;
      root.unmount();
      container.remove();
      resolve(name);
    };
    root.render(<RenameProjectDialog initialName={currentName} onDone={done} />);
  });
  return pending;
}
