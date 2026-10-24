import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./mobile.css";

// Q6 (Phase 8): PWA — chỉ đăng ký ở bản production build. Service worker chỉ
// cache vỏ giao diện (xem public/sw.js); render vẫn cần bridge local.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* trình duyệt/chế độ chặn SW thì editor vẫn chạy bình thường */
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
