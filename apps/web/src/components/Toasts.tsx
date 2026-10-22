/**
 * K5: chồng toast góc dưới-phải, thay cho window.alert rời rạc.
 * Mỗi toast tự đóng sau 4.5s; bấm × để đóng sớm.
 */
import { useEffect, useState } from "react";
import { dismissToast, subscribeToasts, type ToastItem } from "../lib/toast";

const AUTO_CLOSE_MS = 4500;

export function Toasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      window.setTimeout(() => dismissToast(t.id), AUTO_CLOSE_MS),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [toasts]);

  if (toasts.length === 0) return null;
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.kind}`}
          role={t.kind === "error" ? "alert" : "status"}
        >
          <span className="toast-msg">{t.message}</span>
          <button
            className="toast-close"
            aria-label="Đóng thông báo"
            onClick={() => dismissToast(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
