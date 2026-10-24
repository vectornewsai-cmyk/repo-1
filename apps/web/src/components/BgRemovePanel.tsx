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

const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

type Status = "idle" | "running" | "error";

type BgSession = "auto" | "birefnet-general" | "u2net";

export function BgRemovePanel({ mediaItem }: { mediaItem: MediaItem | undefined }) {
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  // Phase 7 P6: chọn session — "auto" (mặc định) thử birefnet trước, lỗi/OOM
  // thì bridge tự chuyển sang u2net và báo qua header X-Bgremove-*.
  const [session, setSession] = useState<BgSession>("auto");
  const abortRef = useRef<AbortController | null>(null);

  const run = async () => {
    if (!mediaItem?.file) {
      setStatus("error");
      setMsg("Không tìm thấy file video gốc.");
      return;
    }
    if (
      !window.confirm(
        "Xoá nền video bằng AI (chạy local, có thể mất vài phút)?\n" +
          "Kết quả là video có nền trong suốt, thay thế clip hiện tại."
      )
    ) {
      return;
    }
    setStatus("running");
    setMsg("Đang xoá nền bằng AI local… (có thể mất vài phút)");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const form = new FormData();
      form.append("media", mediaItem.file, mediaItem.file.name);
      form.append("session", session); // MIT — xem BGREMOVE_LIMITS.md
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
        throw new Error(j?.error || `Bridge lỗi HTTP ${res.status}.`);
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
        `Xong! Clip đã dùng video "${added?.name ?? file.name}" (nền trong suốt, session ${sessionUsed}).` +
        (fallbackFrom
          ? ` Lưu ý: ${fallbackFrom} thất bại trên máy này nên đã tự chuyển sang ${sessionUsed} — chất lượng tách nền có thể kém hơn một chút.`
          : "")
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setStatus("idle");
        setMsg("Đã hủy.");
      } else {
        setStatus("error");
        setMsg((e as Error).message || "Xoá nền thất bại.");
      }
    } finally {
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.75, margin: "0 0 8px" }}>
        AI tách chủ thể khỏi nền (rembg + BiRefNet, chạy 100% trên máy bạn, không gửi
        video đi đâu). Kết quả có nền trong suốt, đặt lên track trên để ghép.
      </p>
      <label style={{ fontSize: 12, display: "block", margin: "0 0 8px" }}>
        Model tách nền{" "}
        <select
          value={session}
          onChange={(e) => setSession(e.target.value as BgSession)}
          disabled={status === "running"}
        >
          <option value="auto">Tự động (birefnet, lỗi thì u2net)</option>
          <option value="birefnet-general">birefnet-general (nét nhất, nặng RAM)</option>
          <option value="u2net">u2net (nhẹ, chạy được máy yếu)</option>
        </select>
      </label>
      {status === "running" ? (
        <div>
          <p style={{ fontSize: 12 }}>{msg}</p>
          <button type="button" onClick={cancel}>Hủy</button>
        </div>
      ) : (
        <button type="button" onClick={run} disabled={!mediaItem?.file}>
          🤖 Xoá nền AI
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
