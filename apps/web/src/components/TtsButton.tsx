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
import { resolveBridgeApiError } from "../lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web
import "./TtsButton.css";
import { formatImportProgressText } from "../lib/importProgressText41W3";
import { pushToast } from "../lib/toast";
// ROUND51-H1: hậu tố giây cho toast done — header thật nếu đọc được,
// khoảng ĐƯỜNG CONG theo GIỌNG đang chọn nếu header thiếu (xem
// ttsEstimate51H1.ts). Chuyển từ helper F3 sang helper H1 ở đợt 51 H1
// (1 import + 1 lời gọi + thêm voice); helper F3 vẫn tồn tại làm
// fallback cho giọng lạ / clone mode và làm bản ghi lịch sử. Component
// KHÔNG hardcode hệ số nào: mọi số đều lấy từ lib H1 (chồng lên F3).
import { ttsDoneSuffixRange51H1 } from "../lib/ttsEstimate51H1";
// ROUND51-H2 (parent gộp): bảng hệ số H2 (25 giọng, tính lại từ pool gộp
// C4/D1/E1/F3 + H2) truyền vào helper H1 — H1 nhận qua tham số
// `coefficients`, không đổi code helper (xem LIMITS H1 §4).
import { TTS_VOICE_COEFFICIENTS_51H2 } from "../lib/ttsEstimate51H2";
import type { ImportFileProgressEvent } from "../lib/ingestProgress39T5";
import { BRIDGE_URL } from "../lib/bridgeUrl";


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
  // Đợt 41 W3 — tiến trình importFiles của file WAV TTS (như MediaBin V5).
  const [importProgress, setImportProgress] = useState<ImportFileProgressEvent | null>(null);
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
      setMsg(i18nT("tts.noRefFile"));
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
        throw new Error(resolveBridgeApiError(j, i18nT, i18nT("tts.bridgeErrorHttp", { status: String(res.status) })));
      }
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error(i18nT("tts.bridgeEmpty"));
      // ROUND51-H1: đừng tự suy dur = 0 là "không có số giây" rồi bỏ
      // hậu tố im lặng như trước — ttsDoneSuffixRange51H1 trả số thật khi
      // header đọc được, và khoảng đường cong " (≈…–…s)" theo GIỌNG đang
      // chọn (nội suy tốc độ theo tỉ lệ chữ số; fallback helper F3 khi
      // giọng lạ hoặc clone) khi header thiếu (nợ đợt 50 F3 §8.1: ngưỡng
      // nhị phân 13% dự báo nhanh hơn thực tế với text 10–12% — vd Kim
      // Thanh P10 thực 21,77 s nhưng khoảng normal F3 chỉ tới ~17,3 s;
      // xem LIMITS H1 §4).
      // Header có thể thiếu vì CORS bridge chưa expose X-TTS-* (sửa gốc
      // ở bridge, xem LIMITS B3 §4) hoặc proxy lột header.
      const durSuffix = ttsDoneSuffixRange51H1({ headerValue: res.headers.get("X-TTS-Duration"), text: t, voice: cloneMode ? undefined : voice, coefficients: TTS_VOICE_COEFFICIENTS_51H2 });
      const file = new File([blob], fileName, { type: "audio/wav" });
      const st = useStore.getState();
      await st.importFiles([file], (ev) => setImportProgress(ev));
      setImportProgress(null);
      // Tìm media item vừa thêm (tên file duy nhất)
      const item = useStore.getState().media.find((m) => m.name === file.name);
      if (!item) throw new Error(i18nT("tts.mediaErr"));
      // ROUND43-Y3: ĐỪNG setMsg(done) ở đây — đó chính là bug đợt 42 X3
      // §4.8: addMediaAtPlayhead() đi qua execCommand đặt selection sang
      // clip audio mới → Inspector rời nhánh text → TtsButton unmount
      // trước khi setMsg kịp render, nên thông báo done KHÔNG BAO GIỜ
      // hiện. Giữ nguyên semantics selection (người dùng thấy clip mới
      // được chọn, giống TemplatePackModal) và báo done bằng toast toàn
      // cục — Toasts gắn ở App root nên sống sót qua lần unmount này.
      // Msg cục bộ vẫn dùng cho busy/lỗi (xảy ra khi còn mounted).
      st.addMediaAtPlayhead(item.id);
      pushToast(i18nT("tts.done", { dur: durSuffix }), "success");
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
        {i18nT("tts.cloneFromSample")}
      </label>
      {cloneMode ? (
        <div className="field-row">
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac,.webm"
            disabled={busy}
            aria-label={i18nT("tts.refFileLabel")}
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
          {i18nT("tts.cloneHint")}
        </div>
      )}
      {msg && <div className="tts-msg">{msg}</div>}
      {importProgress && (
        <div className="tts-msg" role="status" data-import-progress={importProgress.phase}>
          ⏳ {formatImportProgressText(importProgress, (k, vars) => i18nT(k, vars))}
        </div>
      )}
    </div>
  );
}
