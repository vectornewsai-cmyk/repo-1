/**
 * BgRemovePanel — nút "Xoá nền AI" cho video clip (R1-084).
 *
 * Luồng:
 *   1. Lấy file video gốc của clip đang chọn từ media bin
 *   2. POST /api/bgremove (rembg MIT + birefnet-general MIT, 100% local)
 *   3. Nhận file MOV có alpha → thêm vào media bin → đổi clip.src sang file mới
 *      (1 bước undo, giống pattern addCaptionTrack)
 *
 * BẪY LICENSE: bridge từ chối session bria-rmbg/rmbg-2.0 (non-commercial).
 * UI này luôn gửi session mặc định "birefnet-general" (MIT).
 */
import { useRef, useState } from "react";
import { useStore } from "../store";
import type { MediaItem } from "../media";
import { t as i18nT, useLang } from "../i18n";

const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

type Status = "idle" | "running" | "error";

type BgSession = "auto" | "birefnet-general" | "u2net";

export function BgRemovePanel({ mediaItem }: { mediaItem: MediaItem | undefined }) {
  useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  // Phase 7 P6: chọn session — "auto" (mặc định) thử birefnet trước, lỗi/OOM
  // thì bridge tự chuyển sang u2net và báo qua header X-Bgremove-*.
  const [session, setSession] = useState<BgSession>("auto");
  // Phase 9 đợt 2: mượt matte theo thời gian + feather viền (mặc định bật,
  // khớp mặc định bgremove.py: temporal=0.4, feather=1).
  const [temporal, setTemporal] = useState(true);
  const [feather, setFeather] = useState(1);
  const abortRef = useRef<AbortController | null>(null);

  const run = async () => {
    if (!mediaItem?.file) {
      setStatus("error");
      setMsg(i18nT("bgremove.noFile"));
      return;
    }
    if (
      !window.confirm(i18nT("bgremove.confirm"))
    ) {
      return;
    }
    setStatus("running");
    setMsg(i18nT("bgremove.running"));
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const form = new FormData();
      form.append("media", mediaItem.file, mediaItem.file.name);
      form.append("session", session); // MIT — xem BGREMOVE_LIMITS.md
      form.append("temporal", temporal ? "0.4" : "0");
      form.append("feather", String(feather));
      const res = await fetch(`${BRIDGE_URL}/api/bgremove`, {
        method: "POST",
        body: form,
        signal: ctrl.signal,
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const j = ct.includes("application/json")
          ? ((await res.json()) as { error?: string })
          : null;
        throw new Error(j?.error || i18nT("bgremove.bridgeHttp", { status: String(res.status) }));
      }
      // Phase 7 P6: bridge báo session thực sự đã dùng qua header — hiển
      // thị rõ nếu đã fallback (đừng để user tưởng vẫn là birefnet).
      const sessionUsed = res.headers.get("X-Bgremove-Session-Used") || session;
      const fallbackFrom = res.headers.get("X-Bgremove-Fallback-From") || "";
      const blob = await res.blob();
      const dot = mediaItem.name.lastIndexOf(".");
      const base = dot > 0 ? mediaItem.name.slice(0, dot) : mediaItem.name;
      const file = new File([blob], `${base}_no_bg.mov`, { type: "video/quicktime" });

      // Thêm vào media bin rồi đổi clip.src sang file mới (1 bước undo).
      const st = useStore.getState();
      await st.importFiles([file]);
      const added = useStore.getState().media.find((m) => m.name === file.name)
        ?? useStore.getState().media[useStore.getState().media.length - 1];
      const sel = useStore.getState().selection[0];
      if (sel && added) {
        st.patchClip(sel.trackId, sel.clipId, { src: added.name });
      }
      setStatus("idle");
      setMsg(
        i18nT("bgremove.done", { name: added?.name ?? file.name, session: sessionUsed }) +
        (fallbackFrom
          ? i18nT("bgremove.fallbackNote", { from: fallbackFrom, to: sessionUsed })
          : "")
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setStatus("idle");
        setMsg(i18nT("bgremove.aborted"));
      } else {
        setStatus("error");
        setMsg((e as Error).message || i18nT("bgremove.failed"));
      }
    } finally {
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.75, margin: "0 0 8px" }}>
        {i18nT("bgremove.desc")}
      </p>
      <label style={{ fontSize: 12, display: "block", margin: "0 0 8px" }}>
        {i18nT("bgremove.modelLabel")}{" "}
        <select
          value={session}
          onChange={(e) => setSession(e.target.value as BgSession)}
          disabled={status === "running"}
        >
          <option value="auto">{i18nT("bgremove.optAuto")}</option>
          <option value="birefnet-general">{i18nT("bgremove.optBirefnet")}</option>
          <option value="u2net">{i18nT("bgremove.optU2net")}</option>
        </select>
      </label>
      <label style={{ fontSize: 12, display: "block", margin: "0 0 8px" }}>
        <input
          type="checkbox"
          checked={temporal}
          onChange={(e) => setTemporal(e.target.checked)}
          disabled={status === "running"}
        />{" "}
        {i18nT("bgremove.temporalLabel")}
      </label>
      <label style={{ fontSize: 12, display: "block", margin: "0 0 8px" }}>
        {i18nT("bgremove.featherLabel")}{" "}
        <select
          value={feather}
          onChange={(e) => setFeather(Number(e.target.value))}
          disabled={status === "running"}
        >
          <option value={0}>0 px</option>
          <option value={1}>1 px</option>
          <option value={2}>2 px</option>
          <option value={3}>3 px</option>
        </select>
      </label>
      {status === "running" ? (
        <div>
          <p style={{ fontSize: 12 }}>{msg}</p>
          <button type="button" onClick={cancel}>{i18nT("bgremove.cancel")}</button>
        </div>
      ) : (
        <button type="button" onClick={run} disabled={!mediaItem?.file}>
          {i18nT("bgremove.run")}
        </button>
      )}
      {status === "error" && (
        <p style={{ fontSize: 12, color: "#e5484d" }}>{msg}</p>
      )}
      {status === "idle" && msg && (
        <p style={{ fontSize: 12, color: "#30a46c" }}>{msg}</p>
      )}
    </div>
  );
}
