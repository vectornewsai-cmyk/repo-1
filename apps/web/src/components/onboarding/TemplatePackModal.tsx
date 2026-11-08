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
import { useEffect, useRef, useState } from "react";
import { useStore } from "../../store";
import { t as i18nT, useLang } from "../../i18n";
import { resolveBridgeApiError } from "../../lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web
import { formatImportProgressText } from "../../lib/importProgressText41W3";
import type { ImportFileProgressEvent } from "../../lib/ingestProgress39T5";
import { ot } from "../../lib/onboardingCopy";
import { localizeTemplateMeta } from "../../lib/templateContentLocale";
import {
  PackError,
  firstTextOf,
  generatePackFiles,
  getPacks,
  resolvePackSpec,
} from "../../lib/templatePack";
import type { TemplateDef } from "../../lib/templateEngine";
import type { VideoSpec } from "@repo-1/video-spec";
import { BRIDGE_URL } from "../../lib/bridgeUrl";


function aspectLabel(aspect: string): string {
  if (aspect === "1920:1080") return i18nT("templatePicker.aspect169");
  if (aspect === "1080:1920") return i18nT("templatePicker.aspect916");
  if (aspect === "1080:1080") return i18nT("templatePicker.aspect11");
  return aspect;
}

interface DoneInfo {
  spec: VideoSpec;
  clipCount: number;
  firstText: string | null;
}

export function TemplatePackModal({ onClose }: { onClose: () => void }) {
  useLang(); // re-render khi đổi ngôn ngữ
  const packs = getPacks();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Đợt 63 R1: lỗi (vd timeout ghi media mẫu, nợ R10 §2) render ở cuối
  // .modal-body, dưới danh sách 6 pack — ở mobile user phải cuộn mới thấy.
  // Tự cuộn tới lỗi khi nó xuất hiện để lỗi vào vùng nhìn thấy ngay.
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [error]);
  const [done, setDone] = useState<DoneInfo | null>(null);
  const [ttsMsg, setTtsMsg] = useState<string | null>(null);
  const [ttsBusy, setTtsBusy] = useState(false);
  // Đợt 41 W3 — tiến trình importFiles (create + makeTts dùng chung, như MediaBin V5).
  const [importProgress, setImportProgress] = useState<ImportFileProgressEvent | null>(null);

  // Đợt 60 Q10 — Escape đóng modal như nút ✕ / backdrop (pattern O1 đợt 58:
  // guard INPUT/TEXTAREA/SELECT, không chặn BUTTON), NHƯNG bị chặn khi
  // đang tạo pack (busy) hoặc đang tạo giọng đọc mẫu (ttsBusy). Đổi
  // quyết định đợt 59 P2 (parity "✕ cũng không chặn"): create()/makeTts()
  // KHÔNG hủy được an toàn — generatePackFiles / recordPackMedia /
  // importFiles không nhận AbortSignal — nên đóng modal giữa chừng thì
  // job vẫn chạy nền, replaceProject + import media sau lưng user (user
  // tưởng đã hủy). Chặn đóng lúc busy là pattern modal chuẩn; nút ✕
  // disabled và backdrop vô hiệu cùng lúc để chuột không lách qua cùng
  // lỗ hổng. finally{} của create()/makeTts() luôn reset busy/ttsBusy
  // nên modal không kẹt: job luôn kết thúc rồi Escape lại hoạt động.
  // Handler toàn cục của App không có nhánh pack nên listener tự chứa
  // trong modal là đường Escape duy nhất.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (e.key === "Escape") {
        if (busy || ttsBusy) return;
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy, ttsBusy]);

  const create = async (tpl: TemplateDef) => {
    setBusy(true);
    setError(null);
    setDone(null);
    setTtsMsg(null);
    try {
      const suffix = String(Date.now());
      const { files, fileNames } = await generatePackFiles(tpl, suffix);
      const res = resolvePackSpec(tpl, fileNames, i18nT);
      if (!res.ok) throw new Error(res.error);
      const st = useStore.getState();
      st.replaceProject(res.spec);
      await st.importFiles(files, (ev) => setImportProgress(ev));
      setImportProgress(null);
      st.checkMissingMedia();
      const clipCount = res.spec.tracks.reduce((n, t) => n + t.clips.length, 0);
      setDone({ spec: res.spec, clipCount, firstText: firstTextOf(res.spec) });
    } catch (e) {
      if (e instanceof PackError && e.message === "NO_RECORDER") {
        setError(ot("pack.noVideoRecorder"));
      } else if (e instanceof PackError && e.message === "RECORD_TIMEOUT") {
        // Đợt 61 R5: ghi media mẫu quá hạn (MediaRecorder onstop không
        // fire) — báo rõ, finally{} dưới vẫn reset busy nên modal mở khóa
        // (Escape/✕/backdrop lại hoạt động), user bấm "Tạo ngay" lại được.
        setError(ot("pack.recordTimeout"));
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
        throw new Error(resolveBridgeApiError(j, i18nT, i18nT("templatePack.bridgeErrorHttp", { status: String(res.status) })));
      }
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error(i18nT("tts.bridgeEmpty"));
      const dur = Number(res.headers.get("X-TTS-Duration") || 0);
      const file = new File([blob], `tts-pack-${Date.now()}.wav`, { type: "audio/wav" });
      const st = useStore.getState();
      await st.importFiles([file], (ev) => setImportProgress(ev));
      setImportProgress(null);
      const item = useStore.getState().media.find((m) => m.name === file.name);
      if (!item) throw new Error(i18nT("templatePack.mediaAddFailed"));
      st.addMediaAtPlayhead(item.id);
      setTtsMsg(i18nT("templatePack.ttsAdded", { suffix: dur > 0 ? ` (${dur.toFixed(1)}s)` : "" }));
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setTtsMsg(
        m.includes("Failed to fetch")
          ? i18nT("common.bridgeConn", { url: BRIDGE_URL })
          : `❌ ${m}`,
      );
    } finally {
      setTtsBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={busy || ttsBusy ? undefined : onClose}>
      <div
        className="modal template-modal"
        role="dialog"
        aria-modal="true"
        aria-label={ot("pack.title")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{ot("pack.title")}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={ot("pack.close")} disabled={busy || ttsBusy}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {!done && <p className="muted">{ot("pack.lead")}</p>}
          {!done &&
            packs.map((tpl) => {
              // M7: chỉ tên/mô tả HIỂN THỊ được localize; create(tpl) vẫn
              // nhận tpl GỐC (tên project sinh ra bắt nguồn từ tên gốc).
              const meta = localizeTemplateMeta(tpl);
              return (
                <div key={tpl.template.id} className="pack-row">
                  <div>
                    <b>🎬 {meta.name}</b>
                    <p className="muted small">
                      {meta.description} · {aspectLabel(tpl.template.aspect)} · {tpl.template.durationSec}s
                    </p>
                  </div>
                  <button type="button" className="primary" disabled={busy} onClick={() => void create(tpl)}>
                    {busy ? ot("pack.creating") : ot("pack.create")}
                  </button>
                </div>
              );
            })}
          {busy && <p className="muted">{ot("pack.creating")}</p>}
          {importProgress && (
            <p className="muted" role="status" data-import-progress={importProgress.phase}>
              ⏳ {formatImportProgressText(importProgress, (k, vars) => i18nT(k, vars))}
            </p>
          )}
          {error && <p className="error" ref={errorRef}>{error}</p>}
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
