/**
 * TemplatePackModal — “template pack 1 chạm” (R1, Phase 9).
 *
 * Chọn 1 trong 6 pack → media mẫu sinh ngay trên máy (video webm / ảnh PNG
 * Canvas) → spec áp từ template gốc (chữ lấy đúng default) → project mới xem
 * được liền, không cần chuẩn bị file. Sau khi tạo xong:
 * - “Xem ngay”: đóng modal, tua về 0, bấm phát.
 * - “Tạo giọng đọc mẫu”: gọi /api/tts thật qua bridge local (giọng mặc định
 *   của server). Bridge chưa chạy → báo lỗi rõ, KHÔNG có audio giả.
 */
import { useState } from "react";
import { useStore } from "../../store";
import { ot } from "../../lib/onboardingCopy";
import {
  PackError,
  firstTextOf,
  generatePackFiles,
  getPacks,
  resolvePackSpec,
} from "../../lib/templatePack";
import type { TemplateDef } from "../../lib/templateEngine";
import type { VideoSpec } from "@repo-1/video-spec";

const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

function aspectLabel(aspect: string): string {
  if (aspect === "1920:1080") return "16:9 ngang";
  if (aspect === "1080:1920") return "9:16 dọc";
  if (aspect === "1080:1080") return "1:1 vuông";
  return aspect;
}

interface DoneInfo {
  spec: VideoSpec;
  clipCount: number;
  firstText: string | null;
}

export function TemplatePackModal({ onClose }: { onClose: () => void }) {
  const packs = getPacks();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DoneInfo | null>(null);
  const [ttsMsg, setTtsMsg] = useState<string | null>(null);
  const [ttsBusy, setTtsBusy] = useState(false);

  const create = async (tpl: TemplateDef) => {
    setBusy(true);
    setError(null);
    setDone(null);
    setTtsMsg(null);
    try {
      const suffix = String(Date.now());
      const { files, fileNames } = await generatePackFiles(tpl, suffix);
      const res = resolvePackSpec(tpl, fileNames);
      if (!res.ok) throw new Error(res.error);
      const st = useStore.getState();
      st.replaceProject(res.spec);
      await st.importFiles(files);
      st.checkMissingMedia();
      const clipCount = res.spec.tracks.reduce((n, t) => n + t.clips.length, 0);
      setDone({ spec: res.spec, clipCount, firstText: firstTextOf(res.spec) });
    } catch (e) {
      if (e instanceof PackError && e.message === "NO_RECORDER") {
        setError(ot("pack.noVideoRecorder"));
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const watchNow = () => {
    const st = useStore.getState();
    onClose();
    st.setPlayhead(0);
    st.togglePlay(); // replaceProject đặt playing=false nên toggle = phát
  };

  const makeTts = async () => {
    if (!done?.firstText) return;
    setTtsBusy(true);
    setTtsMsg(null);
    try {
      // giọng mặc định của server (giống TtsButton: ưu tiên default, fallback Hải Đăng)
      let voice = "Hải Đăng";
      try {
        const vres = await fetch(`${BRIDGE_URL}/api/tts/voices`);
        if (vres.ok) {
          const j = await vres.json();
          if (j.default) voice = j.default;
          else if (Array.isArray(j.voices) && j.voices.length > 0) voice = j.voices[0].name;
        }
      } catch {
        /* bridge chưa chạy → lỗi sẽ hiện ở bước POST dưới */
      }
      const res = await fetch(`${BRIDGE_URL}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: done.firstText, voice }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `Bridge trả lỗi HTTP ${res.status}`);
      }
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error("Bridge trả về file rỗng.");
      const dur = Number(res.headers.get("X-TTS-Duration") || 0);
      const file = new File([blob], `tts-pack-${Date.now()}.wav`, { type: "audio/wav" });
      const st = useStore.getState();
      await st.importFiles([file]);
      const item = useStore.getState().media.find((m) => m.name === file.name);
      if (!item) throw new Error("Không đưa được file vào kho media.");
      st.addMediaAtPlayhead(item.id);
      setTtsMsg(`✅ Đã thêm giọng đọc${dur > 0 ? ` (${dur.toFixed(1)}s)` : ""} vào timeline.`);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setTtsMsg(
        m.includes("Failed to fetch")
          ? `Không kết nối được bridge (${BRIDGE_URL}). Hãy chạy: cd server/bridge && npm start`
          : `❌ ${m}`,
      );
    } finally {
      setTtsBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal template-modal"
        role="dialog"
        aria-modal="true"
        aria-label={ot("pack.title")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{ot("pack.title")}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={ot("pack.close")}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {!done && <p className="muted">{ot("pack.lead")}</p>}
          {!done &&
            packs.map((tpl) => (
              <div key={tpl.template.id} className="pack-row">
                <div>
                  <b>🎬 {tpl.template.name}</b>
                  <p className="muted small">
                    {tpl.template.description} · {aspectLabel(tpl.template.aspect)} · {tpl.template.durationSec}s
                  </p>
                </div>
                <button type="button" className="primary" disabled={busy} onClick={() => void create(tpl)}>
                  {busy ? ot("pack.creating") : ot("pack.create")}
                </button>
              </div>
            ))}
          {busy && <p className="muted">{ot("pack.creating")}</p>}
          {error && <p className="error">{error}</p>}
          {done && (
            <div>
              <p>
                ✅ {ot("pack.created")} — {done.clipCount} {ot("pack.clips")}
              </p>
              <div className="btn-row" style={{ flexWrap: "wrap" }}>
                <button type="button" className="primary" onClick={watchNow}>
                  {ot("pack.watch")}
                </button>
                {done.firstText && (
                  <button type="button" disabled={ttsBusy} onClick={() => void makeTts()}>
                    {ttsBusy ? ot("pack.ttsBusy") : ot("pack.tts")}
                  </button>
                )}
                <button type="button" onClick={() => setDone(null)}>
                  {ot("pack.again")}
                </button>
              </div>
              {ttsMsg && <p className="muted">{ttsMsg}</p>}
              <p className="muted small">{ot("pack.ttsHint")}</p>
            </div>
          )}
          <p className="muted small">{ot("pack.mediaNote")}</p>
        </div>
      </div>
    </div>
  );
}
