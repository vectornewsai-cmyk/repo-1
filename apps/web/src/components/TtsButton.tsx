/**
 * TtsButton — nút "🔊 Đọc thành tiếng" cho text clip (R1-083, Batch H).
 *
 * Luồng: text của clip đang chọn + giọng đã chọn → POST /api/tts (bridge,
 * VieNeu-TTS v3 Turbo 0.5B chạy 100% local) → nhận file WAV → đưa vào kho
 * media (importFiles) → đặt lên track audio tại playhead (addMediaAtPlayhead).
 * Undo được như mọi thao tác thêm clip khác (qua execCommand của store).
 *
 * License: Apache 2.0 (verify từ PyPI `vieneu` + HF model card, 2026-10-19).
 * Watermark của VieNeu-TTS đã TẮT ở tts.py (apply_watermark=False).
 */
import { useEffect, useState } from "react";
import { useStore } from "../store";

const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

interface TtsVoice {
  name: string;
  gender: string;
  desc: string;
}

export function TtsButton({ text }: { text: string }) {
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [voice, setVoice] = useState<string>("Hải Đăng");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${BRIDGE_URL}/api/tts/voices`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        if (!alive) return;
        if (Array.isArray(j.voices) && j.voices.length > 0) {
          setVoices(j.voices);
          if (j.default) setVoice(j.default);
        }
      })
      .catch(() => { /* bridge chưa chạy → vẫn cho bấm, báo lỗi lúc gọi */ });
    return () => { alive = false; };
  }, []);

  const speak = async () => {
    const t = (text || "").trim();
    if (!t) { setMsg("Chữ đang trống — nhập nội dung trước."); return; }
    setBusy(true);
    setMsg("🔊 Đang tạo giọng đọc (lần đầu có thể mất vài chục giây để nạp model)...");
    try {
      const res = await fetch(`${BRIDGE_URL}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, voice }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `Bridge trả lỗi HTTP ${res.status}`);
      }
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error("Bridge trả về file rỗng.");
      const dur = Number(res.headers.get("X-TTS-Duration") || 0);
      const file = new File([blob], `tts-${voice}-${Date.now()}.wav`, { type: "audio/wav" });
      const st = useStore.getState();
      await st.importFiles([file]);
      // Tìm media item vừa thêm (tên file duy nhất)
      const item = useStore.getState().media.find((m) => m.name === file.name);
      if (!item) throw new Error("Không đưa được file vào kho media.");
      st.addMediaAtPlayhead(item.id);
      setMsg(`✅ Đã thêm giọng đọc${dur > 0 ? ` (${dur.toFixed(1)}s)` : ""} vào timeline.`);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setMsg(m.includes("Failed to fetch")
        ? `Không kết nối được bridge (${BRIDGE_URL}). Hãy chạy: cd server/bridge && npm start`
        : `❌ ${m}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field tts-box" title="Giọng đọc AI local (VieNeu-TTS 0.5B, Apache 2.0). Watermark đã tắt.">
      <span>🔊 Đọc thành tiếng (AI local)</span>
      <div className="field-row">
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          disabled={busy}
          title="Chọn giọng đọc"
          style={{ flex: 1 }}
        >
          {(voices.length > 0 ? voices : [{ name: "Hải Đăng", gender: "nam", desc: "" }]).map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.gender}){v.desc ? ` — ${v.desc}` : ""}
            </option>
          ))}
        </select>
        <button onClick={speak} disabled={busy} title="Tạo file WAV giọng đọc và đặt lên timeline">
          {busy ? "⏳ Đang tạo..." : "🔊 Đọc thành tiếng"}
        </button>
      </div>
      {msg && <div className="tts-msg">{msg}</div>}
    </div>
  );
}
