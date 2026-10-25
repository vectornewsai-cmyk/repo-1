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
import { t as i18nT, useLang } from "../i18n";

const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

interface TtsVoice {
  name: string;
  gender: string;
  desc: string;
}

export function TtsButton({ text }: { text: string }) {
  useLang();
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [voice, setVoice] = useState<string>("Hải Đăng");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // Phase 9 R4: chế độ clone giọng từ file mẫu (VieNeu-TTS encode_reference,
  // 100% local). Mẫu tốt nhất: 3–30s, giọng rõ, ít nhiễu.
  const [cloneMode, setCloneMode] = useState(false);
  const [refFile, setRefFile] = useState<File | null>(null);

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
    if (!t) { setMsg(i18nT("tts.emptyText")); return; }
    if (cloneMode && !refFile) {
      setMsg("Chưa chọn file giọng mẫu để clone.");
      return;
    }
    setBusy(true);
    setMsg(i18nT("tts.busy"));
    try {
      let res: Response;
      let fileName: string;
      if (cloneMode && refFile) {
        const form = new FormData();
        form.append("text", t);
        form.append("refAudio", refFile, refFile.name);
        res = await fetch(`${BRIDGE_URL}/api/tts/clone`, {
          method: "POST",
          body: form,
        });
        fileName = `tts-clone-${Date.now()}.wav`;
      } else {
        res = await fetch(`${BRIDGE_URL}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: t, voice }),
        });
        fileName = `tts-${voice}-${Date.now()}.wav`;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `Bridge trả lỗi HTTP ${res.status}`);
      }
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error(i18nT("tts.bridgeEmpty"));
      const dur = Number(res.headers.get("X-TTS-Duration") || 0);
      const file = new File([blob], fileName, { type: "audio/wav" });
      const st = useStore.getState();
      await st.importFiles([file]);
      // Tìm media item vừa thêm (tên file duy nhất)
      const item = useStore.getState().media.find((m) => m.name === file.name);
      if (!item) throw new Error(i18nT("tts.mediaErr"));
      st.addMediaAtPlayhead(item.id);
      setMsg(i18nT("tts.done", { dur: dur > 0 ? ` (${dur.toFixed(1)}s)` : "" }));
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setMsg(m.includes("Failed to fetch")
        ? i18nT("common.bridgeConn", { url: BRIDGE_URL })
        : `❌ ${m}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field tts-box" title={i18nT("tts.boxTitle")}>
      <span>{i18nT("tts.label")}</span>
      <label>
        <input
          type="checkbox"
          checked={cloneMode}
          disabled={busy}
          onChange={(e) => setCloneMode(e.target.checked)}
        />{" "}
        🎭 Clone giọng từ file mẫu (local)
      </label>
      {cloneMode ? (
        <div className="field-row">
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac,.webm"
            disabled={busy}
            aria-label="File giọng mẫu để clone"
            onChange={(e) => setRefFile(e.target.files?.[0] ?? null)}
            style={{ flex: 1 }}
          />
          <button onClick={speak} disabled={busy} title={i18nT("tts.speakTitle")}>
            {busy ? i18nT("tts.busyBtn") : i18nT("tts.speakBtn")}
          </button>
        </div>
      ) : (
        <div className="field-row">
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            disabled={busy}
            title={i18nT("tts.voiceTitle")}
            style={{ flex: 1 }}
          >
            {(voices.length > 0 ? voices : [{ name: "Hải Đăng", gender: "nam", desc: "" }]).map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.gender}){v.desc ? ` — ${v.desc}` : ""}
              </option>
            ))}
          </select>
          <button onClick={speak} disabled={busy} title={i18nT("tts.speakTitle")}>
            {busy ? i18nT("tts.busyBtn") : i18nT("tts.speakBtn")}
          </button>
        </div>
      )}
      {cloneMode && (
        <div className="muted small">
          Mẫu tốt nhất: 3–30s, một giọng nói rõ, ít nhiễu. Giọng clone chỉ
          dùng trên máy của bạn, không gửi đi đâu.
        </div>
      )}
      {msg && <div className="tts-msg">{msg}</div>}
    </div>
  );
}
