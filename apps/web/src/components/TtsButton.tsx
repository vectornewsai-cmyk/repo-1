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
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { t as i18nT, useLang } from "../i18n";
import { resolveBridgeApiError, type BridgeApiErrorBody } from "../lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web
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
import {
  AI_JOB_STREAM_DROPPED,
  AiJobCancelledError,
  formatAiJobEta,
  readAiJobStream,
  resolveAiJobPhaseLabel,
  type AiJobProgressState,
} from "../lib/aiJobStream"; // Đợt 80 H8: progress + hủy thật cho job AI dài
import { AiJobProgress } from "./AiJobProgress"; // Đợt 80 H8: thanh tiến trình AI dùng chung
import {
  buildVoiceSelectGroups,
  ClonedVoiceApiError,
  clonedSelectValue,
  clonedVoiceById,
  createClonedVoice,
  deleteClonedVoice,
  fetchAllClonedVoicesBackup,
  fetchClonedVoiceBackup,
  fetchClonedVoices,
  formatSampleDuration,
  importClonedVoices,
  parseVoiceSelectValue,
  presetSelectValue,
  type ClonedVoice,
} from "../lib/clonedVoices"; // Đợt 84 L8: giọng đã clone LƯU LẠI ĐƯỢC


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
  // Đợt 80 H8: tiến trình THẬT của job đang chạy (% + ETA) + nút Hủy thật.
  const [jobProgress, setJobProgress] = useState<AiJobProgressState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Đợt 84 L8: giọng đã clone LƯU LẠI ĐƯỢC (tạo 1 lần → dùng như preset).
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [clonedLoadFailed, setClonedLoadFailed] = useState(false);
  const [showCreateVoice, setShowCreateVoice] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState("");
  const [newRefFile, setNewRefFile] = useState<File | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [createProgress, setCreateProgress] = useState<AiJobProgressState | null>(null);
  const createAbortRef = useRef<AbortController | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewVoiceName, setPreviewVoiceName] = useState<string>("");
  const previewUrlRef = useRef<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Đợt 85 M7: export/backup + import giọng clone (file JSON backup).
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const refreshClonedVoices = async () => {
    try {
      const list = await fetchClonedVoices(BRIDGE_URL);
      setClonedVoices(list);
      setClonedLoadFailed(false);
      return list;
    } catch {
      setClonedLoadFailed(true);
      return null;
    }
  };

  useEffect(() => {
    // URL preview (object URL từ blob tải 1 lần) phải revoke khi thay/khi unmount.
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

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
    // Đợt 84 L8: tải danh sách giọng đã clone (bridge chưa chạy → báo
    // nhẹ ở section giọng clone, không chặn nút đọc chính).
    void refreshClonedVoices();
    return () => { alive = false; };
  }, []);

  // Đợt 84 L8: tạo giọng clone mới (tên + file mẫu) — bridge chạy câu thăm
  // dò để verify mẫu rồi mới lưu; progress + hủy thật như speak().
  // Tên/file thiếu → server trả 400 với mã đã dịch (không validate tay).
  const createFileRef = useRef<HTMLInputElement | null>(null);
  const createVoice = async () => {
    if (createBusy) return;
    setCreateBusy(true);
    setCreateMsg(null);
    setCreateProgress(null);
    const ctrl = new AbortController();
    createAbortRef.current = ctrl;
    try {
      const { voice: created, downloadUrl } = await createClonedVoice(BRIDGE_URL, {
        name: newVoiceName,
        file: newRefFile,
        signal: ctrl.signal,
        onPhase: (label) => setCreateMsg(label),
        onProgress: (p) => setCreateProgress(p),
        phaseLabel: (phase) => resolveAiJobPhaseLabel(phase, (k, vars) => i18nT(k, vars)),
      });
      setClonedVoices((prev) => [created, ...prev.filter((v) => v.id !== created.id)]);
      setClonedVoiceId(created.id);
      setNewVoiceName("");
      setNewRefFile(null);
      if (createFileRef.current) createFileRef.current.value = "";
      setCreateMsg(i18nT("tts.voiceCreated", { name: created.name }));
      // Nghe thử: tải blob 1 lần (downloadUrl chỉ dùng được 1 lần) rồi phát
      // qua object URL — không để <audio> tự fetch lại rồi 404.
      try {
        const dlRes = await fetch(`${BRIDGE_URL}${downloadUrl}`, { signal: ctrl.signal });
        if (dlRes.ok) {
          const blob = await dlRes.blob();
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          setPreviewUrl(url);
          setPreviewVoiceName(created.name);
        }
      } catch { /* không nghe được bản thử vẫn giữ giọng đã tạo */ }
    } catch (e) {
      if ((e as Error).name === "AbortError" || e instanceof AiJobCancelledError) {
        setCreateMsg(i18nT("aiJob.cancelled"));
      } else if (e instanceof ClonedVoiceApiError) {
        setCreateMsg(i18nT("tts.voiceCreateFailed", {
          error: resolveBridgeApiError(e.bridgeBody, i18nT, e.message),
        }));
      } else {
        const m = e instanceof Error ? e.message : String(e);
        setCreateMsg(m.includes("Failed to fetch")
          ? i18nT("common.bridgeConn", { url: BRIDGE_URL })
          : `❌ ${m}`);
      }
    } finally {
      setCreateBusy(false);
      createAbortRef.current = null;
    }
  };

  // Đợt 84 L8: xóa giọng đã lưu — bấm 1 lần để xác nhận, bấm lại để xóa thật.
  const removeVoice = async (id: string) => {
    if (deleteConfirmId !== id) { setDeleteConfirmId(id); return; }
    setDeleteConfirmId(null);
    try {
      const removed = await deleteClonedVoice(BRIDGE_URL, id);
      setClonedVoices((prev) => prev.filter((v) => v.id !== id));
      if (clonedVoiceId === id) setClonedVoiceId(null);
      setCreateMsg(i18nT("tts.voiceDeleted", { name: removed.name }));
    } catch (e) {
      const body = e instanceof ClonedVoiceApiError ? e.bridgeBody : null;
      setCreateMsg(`❌ ${resolveBridgeApiError(body, i18nT, e instanceof Error ? e.message : String(e))}`);
    }
  };

  // Đợt 85 M7: export/backup + import giọng clone (file JSON: voice +
  // ref audio base64 + sha256; bridge verify sha + chạy câu thăm dò trước
  // khi ghi registry). Tải file về máy user qua blob + thẻ <a> — backup
  // không bao giờ tự upload đi đâu.
  const downloadBackupBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportVoice = async (v: ClonedVoice) => {
    if (backupBusy) return;
    setBackupBusy(true);
    setBackupMsg(null);
    try {
      const { blob, filename } = await fetchClonedVoiceBackup(BRIDGE_URL, v);
      downloadBackupBlob(blob, filename);
      setBackupMsg(i18nT("tts.voiceExported", { name: v.name }));
    } catch (e) {
      const body = e instanceof ClonedVoiceApiError ? e.bridgeBody : null;
      setBackupMsg(i18nT("tts.voiceExportFailed", {
        error: resolveBridgeApiError(body, i18nT, e instanceof Error ? e.message : String(e)),
      }));
    } finally {
      setBackupBusy(false);
    }
  };

  const exportAllVoices = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    setBackupMsg(null);
    try {
      const { blob, filename } = await fetchAllClonedVoicesBackup(BRIDGE_URL);
      downloadBackupBlob(blob, filename);
      setBackupMsg(i18nT("tts.allVoicesExported", { count: String(clonedVoices.length) }));
    } catch (e) {
      const body = e instanceof ClonedVoiceApiError ? e.bridgeBody : null;
      setBackupMsg(i18nT("tts.voiceExportFailed", {
        error: resolveBridgeApiError(body, i18nT, e instanceof Error ? e.message : String(e)),
      }));
    } finally {
      setBackupBusy(false);
    }
  };

  const importBackupFile = async (file: File) => {
    if (backupBusy) return;
    setBackupBusy(true);
    setBackupMsg(i18nT("tts.importingVoicesBtn"));
    try {
      const summary = await importClonedVoices(BRIDGE_URL, { file });
      await refreshClonedVoices();
      const parts: string[] = [];
      if (summary.imported.length > 0) {
        parts.push(i18nT("tts.voiceImported", {
          count: String(summary.imported.length),
          names: summary.imported.map((v) => v.name).join(", "),
        }));
        // Giọng vừa nhập xong thì chọn ngay để dùng như preset.
        setClonedVoiceId(summary.imported[0].id);
      }
      if (summary.skipped.length > 0) {
        parts.push(i18nT("tts.importSkipped", {
          count: String(summary.skipped.length),
          names: summary.skipped.map((s) => s.name).join(", "),
        }));
      }
      if (summary.failed.length > 0) {
        parts.push(i18nT("tts.importFailedDetail", {
          count: String(summary.failed.length),
          names: summary.failed.map((s) => s.name).join(", "),
        }));
      }
      setBackupMsg(parts.length > 0 ? parts.join(" ") : i18nT("tts.voiceImportFailed", { error: "?" }));
    } catch (e) {
      const body = e instanceof ClonedVoiceApiError ? e.bridgeBody : null;
      setBackupMsg(i18nT("tts.voiceImportFailed", {
        error: resolveBridgeApiError(body, i18nT, e instanceof Error ? e.message : String(e)),
      }));
    } finally {
      setBackupBusy(false);
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };

  const speak = async () => {
    const t = (text || "").trim();
    if (!t) { setMsg(i18nT("tts.emptyText")); return; }
    if (cloneMode && !refFile) {
      setMsg(i18nT("tts.noRefFile"));
      return;
    }
    setBusy(true);
    setMsg(i18nT("tts.busy"));
    setJobProgress(null);
    // Đợt 80 H8: AbortController cho nút Hủy — abort fetch → bridge kill
    // python thật (trước đây TTS không có nút hủy, đóng panel cũng không
    // dừng được job; model vẫn tổng hợp nền tới hết).
    const ctrl = new AbortController();
    abortRef.current = ctrl;
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
          signal: ctrl.signal,
        });
        fileName = `tts-clone-${Date.now()}.wav`;
      } else if (clonedVoiceId) {
        // Đợt 84 L8: giọng đã clone đã lưu — bridge tự lấy file mẫu đã lưu.
        res = await fetch(`${BRIDGE_URL}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: t, clonedVoiceId }),
          signal: ctrl.signal,
        });
        const cv = clonedVoiceById(clonedVoices, clonedVoiceId);
        fileName = `tts-clone-${cv ? cv.name : clonedVoiceId}-${Date.now()}.wav`;
      } else {
        res = await fetch(`${BRIDGE_URL}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: t, voice }),
          signal: ctrl.signal,
        });
        fileName = `tts-${voice}-${Date.now()}.wav`;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        // Đợt 84 L8: giọng đã lưu bị xóa/mất file mẫu ở bridge → bỏ chọn
        // giọng đó, tải lại list, báo rõ để user chọn lại.
        if (clonedVoiceId && res.status === 404 &&
          j && (j as { errorCode?: string }).errorCode === "TTS_CLONED_VOICE_NOT_FOUND") {
          setClonedVoiceId(null);
          void refreshClonedVoices();
          throw new Error(i18nT("tts.clonedVoiceMissing"));
        }
        throw new Error(resolveBridgeApiError(j, i18nT, i18nT("tts.bridgeErrorHttp", { status: String(res.status) })));
      }
      // Đợt 80 H8: /api/tts giờ stream NDJSON (phase load/synth + progress
      // chunk thật + done { downloadUrl }) thay vì trả WAV trực tiếp.
      let doneEvt;
      try {
        doneEvt = await readAiJobStream(res, {
          onPhase: (phase) => {
            setMsg(resolveAiJobPhaseLabel(phase, (k, vars) => i18nT(k, vars)));
          },
          onProgress: (p) => {
            setMsg(resolveAiJobPhaseLabel(p.phase, (k, vars) => i18nT(k, vars)));
            setJobProgress(p);
          },
        });
      } catch (e) {
        if (e instanceof AiJobCancelledError) throw e;
        if ((e as Error).message === AI_JOB_STREAM_DROPPED) {
          throw new Error(i18nT("common.bridgeConn", { url: BRIDGE_URL }));
        }
        const body = (e as { bridgeBody?: BridgeApiErrorBody }).bridgeBody;
        throw new Error(resolveBridgeApiError(body ?? null, i18nT, i18nT("tts.bridgeErrorHttp", { status: "?" })));
      }
      const downloadUrl = typeof doneEvt.downloadUrl === "string" ? doneEvt.downloadUrl : "";
      if (!downloadUrl) throw new Error(i18nT("tts.bridgeEmpty"));
      setMsg(i18nT("aiJob.downloading"));
      const dlRes = await fetch(`${BRIDGE_URL}${downloadUrl}`, { signal: ctrl.signal });
      if (!dlRes.ok) {
        throw new Error(i18nT("aiJob.downloadFailed", { status: String(dlRes.status) }));
      }
      const blob = await dlRes.blob();
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
      // Đợt 80 H8: durationSec còn có trong event done — dùng làm fallback
      // khi header download thiếu (header vẫn được ưu tiên như cũ).
      const headerDur = dlRes.headers.get("X-TTS-Duration");
      const durSuffix = ttsDoneSuffixRange51H1({ headerValue: headerDur ?? (typeof doneEvt.durationSec === "number" && doneEvt.durationSec > 0 ? String(doneEvt.durationSec) : null), text: t, voice: cloneMode || clonedVoiceId ? undefined : voice, coefficients: TTS_VOICE_COEFFICIENTS_51H2 });
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
      if ((e as Error).name === "AbortError" || e instanceof AiJobCancelledError) {
        setMsg(i18nT("aiJob.cancelled"));
      } else {
        const m = e instanceof Error ? e.message : String(e);
        setMsg(m.includes("Failed to fetch")
          ? i18nT("common.bridgeConn", { url: BRIDGE_URL })
          : `❌ ${m}`);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
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
            value={clonedVoiceId ? clonedSelectValue(clonedVoiceId) : presetSelectValue(voice)}
            onChange={(e) => {
              const sel = parseVoiceSelectValue(e.target.value, "Hải Đăng");
              if (sel.kind === "cloned") {
                setClonedVoiceId(sel.id);
              } else {
                setClonedVoiceId(null);
                setVoice(sel.name);
              }
            }}
            disabled={busy}
            title={i18nT("tts.voiceTitle")}
            style={{ flex: 1 }}
          >
            {buildVoiceSelectGroups(
              voices.length > 0 ? voices : [{ name: "Hải Đăng", gender: "nam", desc: "" }],
              clonedVoices,
              {
                presetGroup: i18nT("tts.presetGroupLabel"),
                clonedGroup: i18nT("tts.clonedGroupLabel"),
                cloneWord: "clone",
              },
            ).map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
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
      {/* Đợt 84 L8: giọng đã clone lưu lại được — tạo/xóa/dùng như preset. */}
      <div className="tts-cloned">
        <div className="field-row">
          <span>{i18nT("tts.clonedVoicesTitle")}</span>
          <button
            type="button"
            onClick={() => setShowCreateVoice((v) => !v)}
            disabled={createBusy}
            title={i18nT("tts.createVoiceTitle")}
          >
            {i18nT("tts.createVoiceTitle")}
          </button>
        </div>
        {/* Đợt 85 M7: export/backup + import giọng clone (file JSON). */}
        <div className="field-row">
          <button type="button" onClick={() => void exportAllVoices()} disabled={backupBusy || clonedVoices.length === 0}>
            {i18nT("tts.exportAllVoices")}
          </button>
          <button type="button" onClick={() => importFileRef.current?.click()} disabled={backupBusy}>
            {backupBusy ? i18nT("tts.importingVoicesBtn") : i18nT("tts.importVoices")}
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json,application/json"
            disabled={backupBusy}
            aria-label={i18nT("tts.importVoices")}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importBackupFile(f);
            }}
            style={{ display: "none" }}
          />
        </div>
        {backupMsg && <div className="tts-msg">{backupMsg}</div>}
        {clonedLoadFailed && <div className="muted small">{i18nT("tts.loadVoicesFailed")}</div>}
        {clonedVoices.length === 0 ? (
          <div className="muted small">{i18nT("tts.clonedVoicesEmpty")}</div>
        ) : (
          <ul className="tts-cloned-list">
            {clonedVoices.map((v) => (
              <li key={v.id}>
                <span>
                  {v.name}
                  {formatSampleDuration(v.refDurationSec) ? ` · ${formatSampleDuration(v.refDurationSec)}` : ""}
                </span>
                <button type="button" disabled={backupBusy} onClick={() => void exportVoice(v)}>
                  {i18nT("tts.exportVoice")}
                </button>
                <button type="button" disabled={createBusy} onClick={() => void removeVoice(v.id)}>
                  {deleteConfirmId === v.id ? i18nT("tts.deleteVoiceConfirm") : i18nT("tts.deleteVoice")}
                </button>
              </li>
            ))}
          </ul>
        )}
        {showCreateVoice && (
          <div className="tts-clone-create">
            <div className="muted small">{i18nT("tts.cloneCreateHint")}</div>
            <div className="field-row">
              <input
                type="text"
                value={newVoiceName}
                disabled={createBusy}
                placeholder={i18nT("tts.voiceNamePlaceholder")}
                aria-label={i18nT("tts.voiceNameLabel")}
                onChange={(e) => setNewVoiceName(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                ref={createFileRef}
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac,.webm"
                disabled={createBusy}
                aria-label={i18nT("tts.refFileLabel")}
                onChange={(e) => setNewRefFile(e.target.files?.[0] ?? null)}
                style={{ flex: 1 }}
              />
            </div>
            <div className="field-row">
              <button type="button" onClick={() => void createVoice()} disabled={createBusy}>
                {createBusy ? i18nT("tts.creatingVoiceBtn") : i18nT("tts.createVoiceBtn")}
              </button>
            </div>
            {createMsg && <div className="tts-msg">{createMsg}</div>}
            {createBusy && (
              <div className="tts-msg">
                <AiJobProgress
                  progress={createProgress?.progress ?? null}
                  etaText={formatAiJobEta(createProgress?.etaSeconds ?? null, (k, vars) => i18nT(k, vars))}
                  onCancel={() => createAbortRef.current?.abort()}
                />
              </div>
            )}
            {previewUrl && (
              <div className="tts-msg">
                <div className="muted small">
                  {i18nT("tts.previewLabel")} {previewVoiceName}
                </div>
                <audio controls src={previewUrl} style={{ width: "100%" }} />
              </div>
            )}
          </div>
        )}
      </div>
      {msg && <div className="tts-msg">{msg}</div>}
      {/* Đợt 80 H8: tiến trình THẬT (% chunk + ETA) + nút Hủy thật. */}
      {busy && (
        <div className="tts-msg">
          <AiJobProgress
            progress={jobProgress?.progress ?? null}
            etaText={formatAiJobEta(jobProgress?.etaSeconds ?? null, (k, vars) => i18nT(k, vars))}
            onCancel={() => abortRef.current?.abort()}
          />
        </div>
      )}
      {importProgress && (
        <div className="tts-msg" role="status" data-import-progress={importProgress.phase}>
          ⏳ {formatImportProgressText(importProgress, (k, vars) => i18nT(k, vars))}
        </div>
      )}
    </div>
  );
}
