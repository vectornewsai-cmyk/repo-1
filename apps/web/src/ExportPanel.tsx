/**
 * Panel Export: kiểm tra spec hợp lệ (dùng isVideoSpec + kiểm tra sâu),
 * xem trước JSON, tải xuống file .videospec.json hoặc sao chép.
 *
 * Phase P0-01: thêm xuất MP4 thật qua bridge server (server/bridge/).
 * Bridge nhận spec + file media, chạy render worker, trả về MP4.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { VideoSpec } from "@repo-1/video-spec";
import { isVideoSpec, projectDuration, SPEC_VERSION } from "@repo-1/video-spec";
import { buildSharePage, downloadSharePage, SHARE_EMBED_MAX_BYTES } from "./lib/sharePage";
import { collectSpeedCurveWarnings } from "./lib/projectRepo";
import {
  exportCurveBlockers,
  formatSanitizeSummaryLocalized,
  sanitizeSpecSpeedCurves,
} from "./lib/curveFix";
import {
  formatFixEntryChanges,
  formatWarningTranslated,
  resolveUnsalvageableReason,
} from "./lib/loadReport";
import { getLang, t, useLang } from "./i18n";
import { pushToast } from "./lib/toast";
import { localizedErrorSummary } from "./lib/errorDetailSummary";
import { resolveBridgeApiError } from "./lib/bridgeErrors"; // Đợt 62 R5: dịch mã lỗi bridge→web
import { resolveValidationDetails } from "./lib/validationErrors"; // Đợt 63 R5: dịch từng dòng validator
import { resolveJobNote } from "./lib/jobNote64R8"; // Đợt 64 R8: hiển thị job.note (phục hồi sau restart) trong khối tiến trình render
import {
  pickResumeCandidate,
  resumeJobStrings,
  type ResumableRenderJob,
} from "./lib/resumeRenderJob66T8"; // Đợt 66 T8: resume job đang chạy khi mở lại panel (đóng nợ S10 đợt 65)
import {
  UPLOAD_JOB_MATCH_TOLERANCE_MS,
  UPLOAD_WAIT_TIMEOUT_MS,
  beginUploadSession,
  clearUploadSession,
  findJobCreatedAfter,
  historyEntryFromJob,
  historyStatusLabel,
  isUploadSessionStale,
  jobHistoryStrings,
  loadJobHistory,
  persistJobHistory,
  readUploadSession,
  recordJobHistory,
  removeJobHistory,
  upsertHistoryEntry,
  type JobHistoryEntry,
  type UploadSession,
} from "./lib/jobHistory67U7"; // Đợt 67 U7: lịch sử job + nhánh interrupted trong poll + resume upload khi đóng panel (đóng nợ T8 đợt 66)
import {
  gpuProbeDoneText,
  gpuProbeErrorText,
  gpuProbeStatusText,
  gpuProbeStrings,
  type GpuProbeStatus,
} from "./lib/gpuProbe65S4"; // Đợt 65 S4: trạng thái probe GPU + nút "Probe lại GPU" (đóng nợ cache probe đợt 64 R1)
import {
  checkDownloadAvailable,
  exportDestStrings,
  findHistoryExportDest,
  type DownloadAvailability,
} from "./lib/exportDest68V8"; // Đợt 68 V8: đích export bền qua reopen + kiểm tra download trước khi hiện nút (đóng nợ U7 đợt 67 §5.1–5.2)
import {
  loadStabSingleThread,
  saveStabSingleThread,
  stabSingleThreadStrings,
} from "./lib/stabSingleThread68V2"; // Đợt 68 V2: toggle stabilize single-thread decode (đợt 67 U1)
// Phase 10 G4 — trong Electron, chọn đích .mp4 trước khi render rồi
// lưu MP4 đã render xong ra đó (thay vì tải xuống qua trình duyệt).
import { isNativeDesktop, pickExportDestinationNative, saveExportNative } from "./lib/nativeFiles";
import { useStore } from "./store";
import { fmtTime } from "./lib";
import { formatImportProgressText } from "./lib/importProgressText41W3";
import type { ImportFileProgressEvent } from "./lib/ingestProgress39T5";
import {
  EXPORT_PRESETS,
  X264_PRESETS,
  defaultCustomPreset,
  estimateSize,
  formatBytes,
  getPreset,
  presetSummary,
  validateExportPreset,
  type ExportPreset,
  type X264Preset,
} from "./lib/exportPresets";
import { BRIDGE_URL } from "./lib/bridgeUrl";
// Đợt 73 A9 (S4): publish preset đang chọn để preview vẽ overlay
// safe-area đúng nền tảng (pub/sub module, không qua store).
import { setSelectedExportPreset } from "./lib/exportPresetSelection";
// Đợt 76 D9: cảnh báo letterbox + lựa chọn crop khi preset lệch tỉ lệ nguồn.
import {
  aspectMismatch,
  aspectRatioLabel,
  loadAspectFit,
  normalizeAspectFit,
  saveAspectFit,
  type AspectFit,
} from "./lib/aspectFit76D9";
import {
  AI_JOB_STREAM_DROPPED,
  AiJobCancelledError,
  formatAiJobEta,
  readAiJobStream,
  resolveAiJobPhaseLabel,
  type AiJobProgressState,
} from "./lib/aiJobStream"; // Đợt 80 H8: progress + hủy thật cho job AI dài
import { AiJobProgress } from "./components/AiJobProgress"; // Đợt 80 H8: thanh tiến trình AI dùng chung
import type { BridgeApiErrorBody } from "./lib/bridgeErrors";


type RenderStatus = "idle" | "uploading" | "rendering" | "done" | "error" | "cancelled";

/** Đợt 29 L3 — errorDetail đã redact từ bridge (chỉ khi poll kèm ?detail=1).
 *  Đợt 30 M4 — chuỗi UI của khối này đã qua key i18n `exportPanel.*`
 *  (chuỗi cứng tạm của L3 đã thay hết, xem LIMITS đợt 30 M4). */
interface RenderErrorDetail {
  code: string;
  summary: string;
  // Đợt 34 Q4: bridge kèm thêm (additive); payload bridge cũ không có
  // 2 field này thì localizedErrorSummary fallback về summary thô.
  summaryKey?: string;
  summaryParams?: Record<string, string>;
  details: string[];
  detailsOmitted: number;
  redactedTail: string;
  // Đợt 63 R5: dòng validator đã dịch được (additive; payload cũ không có
  // thì hiển thị details thô như trước). Entry { where, code, params }.
  validationDetails?: Array<{
    where: string;
    code: string;
    params: Record<string, string>;
  }>;
  validationDetailsOmitted?: number;
}

/** 1 điểm trajectory từ reframe.py --analyze-only (tọa độ pixel nguồn). */
interface TrajPoint {
  frame: number;
  t: number;
  x0: number;
  y0: number;
  w: number;
  h: number;
  x_center_norm: number;
}

/** Summary JSON của /api/reframe/analyze (Phase 7 P6). */
interface TrajSummary {
  aspect: string;
  source_size: [number, number];
  duration_sec: number;
  detections: { face: number; motion: number; none: number };
  crop_window: [number, number];
  trajectory: TrajPoint[];
  trajectory_points: number;
}

/** R1-083/R1-085: Auto-reframe — crop video theo chủ thể qua bridge /api/reframe. */
function ReframeSection({ media, bridgeUrl }: { media: import("./media").MediaItem[]; bridgeUrl: string }) {
  const videos = media.filter((m) => m.kind === "video" && m.file);
  const [videoName, setVideoName] = useState<string>(videos[0]?.name ?? "");
  const [aspect, setAspect] = useState<string>("9:16");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  // Đợt 80 H8: tiến trình THẬT của job đang chạy (% + ETA) + nút Hủy thật.
  const [jobProgress, setJobProgress] = useState<AiJobProgressState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Đợt 41 W3 — tiến trình importFiles của file reframe (như MediaBin V5).
  const [importProgress, setImportProgress] = useState<ImportFileProgressEvent | null>(null);
  // Phase 7 P6: trajectory preview — xem trước quỹ đạo crop trước khi render.
  const [traj, setTraj] = useState<TrajSummary | null>(null);
  const [trajStatus, setTrajStatus] = useState<"idle" | "working" | "error">("idle");
  const [trajError, setTrajError] = useState<string>("");
  const trajCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const previewTrajectory = async () => {
    const item = videos.find((m) => m.name === videoName);
    if (!item?.file || trajStatus === "working") return;
    setTrajStatus("working");
    setTrajError("");
    try {
      const form = new FormData();
      form.append("media", item.file, item.file.name);
      form.append("aspect", aspect);
      const res = await fetch(`${bridgeUrl}/api/reframe/analyze`, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(resolveBridgeApiError(body, t, t("exportPanel.bridgeError", { status: String(res.status) })));
      }
      setTraj((await res.json()) as TrajSummary);
      setTrajStatus("idle");
    } catch (e) {
      setTrajStatus("error");
      setTrajError(
        e instanceof Error
          ? e.message
          : t("exportPanel.bridgeServerDown", { url: bridgeUrl }),
      );
    }
  };

  // Vẽ overlay quỹ đạo: khung nguồn + các crop rect mờ + đường tâm crop.
  useEffect(() => {
    const canvas = trajCanvasRef.current;
    if (!canvas || !traj) return;
    const [W, H] = traj.source_size;
    const cw = 480;
    const ch = Math.max(120, Math.round((480 * H) / W));
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (x: number) => (x * cw) / W;
    const sy = (y: number) => (y * ch) / H;
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1);
    const pts = traj.trajectory;
    if (pts.length === 0) return;
    // Crop rect mờ (lấy mẫu tối đa 48 rect để không rối).
    const step = Math.max(1, Math.floor(pts.length / 48));
    ctx.fillStyle = "rgba(76, 195, 138, 0.07)";
    ctx.strokeStyle = "rgba(76, 195, 138, 0.35)";
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i];
      ctx.fillRect(sx(p.x0), sy(p.y0), sx(p.w), sy(p.h));
      ctx.strokeRect(sx(p.x0), sy(p.y0), sx(p.w), sy(p.h));
    }
    // Đường tâm crop (xanh lá) + điểm đầu/cuối.
    ctx.strokeStyle = "#4cc38a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = sx(p.x0 + p.w / 2);
      const y = sy(p.y0 + p.h / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    const dot = (p: TrajPoint, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx(p.x0 + p.w / 2), sy(p.y0 + p.h / 2), 5, 0, Math.PI * 2);
      ctx.fill();
    };
    dot(pts[0], "#30a46c");
    dot(pts[pts.length - 1], "#e5484d");
    // Rect đầu/cuối đậm để thấy rõ window bắt đầu/kết thúc ở đâu.
    ctx.strokeStyle = "#30a46c";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx(pts[0].x0), sy(pts[0].y0), sx(pts[0].w), sy(pts[0].h));
    ctx.strokeStyle = "#e5484d";
    ctx.strokeRect(
      sx(pts[pts.length - 1].x0), sy(pts[pts.length - 1].y0),
      sx(pts[pts.length - 1].w), sy(pts[pts.length - 1].h)
    );
  }, [traj]);

  const start = async () => {
    const item = videos.find((m) => m.name === videoName);
    if (!item?.file || status === "working") return;
    setStatus("working");
    setMessage(t("exportPanel.reframeAnalyzing"));
    setJobProgress(null);
    // Đợt 80 H8: AbortController cho nút Hủy — abort fetch → bridge kill
    // python thật (trước đây reframe không hủy được).
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const form = new FormData();
      form.append("media", item.file, item.file.name);
      form.append("aspect", aspect);
      const res = await fetch(`${bridgeUrl}/api/reframe`, { method: "POST", body: form, signal: ctrl.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(resolveBridgeApiError(body, t, t("exportPanel.bridgeError", { status: String(res.status) })));
      }
      // Đợt 80 H8: /api/reframe giờ stream NDJSON (progress % thật →
      // done { downloadUrl }) thay vì trả MP4 trực tiếp.
      let doneEvt;
      try {
        doneEvt = await readAiJobStream(res, {
          onPhase: (phase) => {
            setMessage(resolveAiJobPhaseLabel(phase, (k, vars) => t(k, vars)));
          },
          onProgress: (p) => {
            setMessage(resolveAiJobPhaseLabel(p.phase, (k, vars) => t(k, vars)));
            setJobProgress(p);
          },
        });
      } catch (e) {
        if (e instanceof AiJobCancelledError) throw e;
        if ((e as Error).message === AI_JOB_STREAM_DROPPED) {
          throw new Error(t("exportPanel.bridgeServerDown", { url: bridgeUrl }));
        }
        const body = (e as { bridgeBody?: BridgeApiErrorBody }).bridgeBody;
        throw new Error(resolveBridgeApiError(body ?? null, t, t("exportPanel.bridgeError", { status: "?" })));
      }
      const downloadUrl = typeof doneEvt.downloadUrl === "string" ? doneEvt.downloadUrl : "";
      if (!downloadUrl) throw new Error(t("exportPanel.bridgeServerDown", { url: bridgeUrl }));
      setMessage(t("aiJob.downloading"));
      const dlRes = await fetch(`${bridgeUrl}${downloadUrl}`, { signal: ctrl.signal });
      if (!dlRes.ok) {
        throw new Error(t("aiJob.downloadFailed", { status: String(dlRes.status) }));
      }
      const blob = await dlRes.blob();
      if (!blob || blob.size === 0) throw new Error(t("aiJob.downloadEmpty"));
      const dot = item.name.lastIndexOf(".");
      const base = dot > 0 ? item.name.slice(0, dot) : item.name;
      const outName = `${base}_${aspect.replace(":", "x")}.mp4`;
      const file = new File([blob], outName, { type: "video/mp4" });
      await useStore.getState().importFiles([file], (ev) => setImportProgress(ev));
      setImportProgress(null);
      setStatus("done");
      setMessage(t("exportPanel.reframeAdded", { name: outName }));
    } catch (e) {
      if ((e as Error).name === "AbortError" || e instanceof AiJobCancelledError) {
        setStatus("idle");
        setMessage(t("aiJob.cancelled"));
        return;
      }
      setStatus("error");
      setMessage(
        e instanceof Error
          ? `❌ ${e.message}`
          : `❌ ${t("exportPanel.bridgeServerDown", { url: bridgeUrl })}`,
      );
    } finally {
      abortRef.current = null;
    }
  };

  if (videos.length === 0) return null;
  return (
    <div className="reframe-section">
      <div className="panel-head">{t("exportPanel.reframeTitle")}</div>
      <p className="tips">{t("exportPanel.reframeIntro")}</p>
      <div className="preset-row">
        <label htmlFor="reframe-video">Video:</label>
        <select
          id="reframe-video"
          value={videoName}
          onChange={(e) => { setVideoName(e.target.value); setTraj(null); }}
          disabled={status === "working"}
        >
          {videos.map((v) => (
            <option key={v.id} value={v.name}>{v.name}</option>
          ))}
        </select>
        <label htmlFor="reframe-aspect">{t("exportPanel.aspect")}</label>
        <select
          id="reframe-aspect"
          value={aspect}
          onChange={(e) => { setAspect(e.target.value); setTraj(null); }}
          disabled={status === "working"}
        >
          <option value="9:16">9:16 (TikTok/Reels)</option>
          <option value="1:1">1:1 (Instagram)</option>
          <option value="4:5">4:5 (Facebook)</option>
        </select>
        <button onClick={previewTrajectory} disabled={trajStatus === "working" || !videoName}>
          {trajStatus === "working" ? t("exportPanel.reframeWorking") : t("exportPanel.reframePreview")}
        </button>
        <button className="primary" onClick={start} disabled={status === "working" || !videoName}>
          {status === "working" ? t("exportPanel.reframeWorking2") : "🔍 Auto-reframe"}
        </button>
      </div>
      {message && <p className="tips">{message}</p>}
      {/* Đợt 80 H8: tiến trình THẬT (% + ETA) + nút Hủy thật cho reframe. */}
      {status === "working" && (
        <AiJobProgress
          progress={jobProgress?.progress ?? null}
          etaText={formatAiJobEta(jobProgress?.etaSeconds ?? null, (k, vars) => t(k, vars))}
          onCancel={() => abortRef.current?.abort()}
        />
      )}
      {importProgress && (
        <p className="tips" role="status" data-import-progress={importProgress.phase}>
          ⏳ {formatImportProgressText(importProgress, (k, vars) => t(k, vars))}
        </p>
      )}
      {trajStatus === "error" && <p className="tips">❌ {trajError}</p>}
      {traj && (
        <div style={{ marginTop: 8 }}>
          <canvas ref={trajCanvasRef} style={{ maxWidth: "100%", borderRadius: 4 }} />
          <p className="tips">
            {t("exportPanel.trajSummary", {
              sw: String(traj.source_size[0]),
              sh: String(traj.source_size[1]),
              cw: String(traj.crop_window[0]),
              ch: String(traj.crop_window[1]),
              aspect: traj.aspect,
              points: String(traj.trajectory_points),
              duration: String(traj.duration_sec),
              face: String(traj.detections.face),
              motion: String(traj.detections.motion),
              none: String(traj.detections.none),
            })}
            {traj.crop_window[0] >= traj.source_size[0] &&
              ` ${t("exportPanel.sourceNarrow")}`}
          </p>
        </div>
      )}
    </div>
  );
}

/** R1-065: format ETA giây → "1:23" / "1:02:03". */
function fmtEta(sec: number | null): string {
  if (sec == null || !isFinite(sec) || sec < 0) return "…";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return (h > 0 ? `${h}:` : "") + `${mm}:${String(r).padStart(2, "0")}`;
}

/**
 * Phase 9 R56 M2 — giữ <code>URL</code> khi câu đã qua key i18n
 * (key chứa {url} = BRIDGE_URL, tách ra để bọc lại bằng <code>).
 */
function codeToken(text: string, token: string): ReactNode {
  const [a, b] = text.split(token);
  if (b === undefined) return text;
  return (
    <>
      {a}
      <code>{token}</code>
      {b}
    </>
  );
}

/** Kiểm tra sâu hơn isVideoSpec: mọi field số phải hợp lệ, clip phải có src... */
function deepValidate(spec: VideoSpec): string[] {
  const issues: string[] = [];
  const m = spec.meta;
  if (!m.name) issues.push(t("exportPanel.specIssueMetaName"));
  if (!(m.width > 0) || !(m.height > 0)) issues.push(t("exportPanel.specIssueMetaSize"));
  if (!(m.fps > 0)) issues.push(t("exportPanel.specIssueMetaFps"));
  for (const tr of spec.tracks) {
    if (!tr.id) issues.push(t("exportPanel.specIssueTrackNoId"));
    if (!["video", "audio", "text", "sticker", "image"].includes(tr.kind)) issues.push(t("exportPanel.specIssueTrackKind", { id: tr.id }));
    if (!Array.isArray(tr.clips)) {
      issues.push(t("exportPanel.specIssueTrackClips", { id: tr.id }));
      continue;
    }
    for (const c of tr.clips) {
      const tag = `Clip ${c.id}`;
      if (!(c.start >= 0)) issues.push(t("exportPanel.specIssueClipStart", { clip: tag }));
      if (!(c.duration > 0)) issues.push(t("exportPanel.specIssueClipDuration", { clip: tag }));
      if (c.kind === "video" || c.kind === "audio") {
        if (!c.src) issues.push(t("exportPanel.specIssueClipSrc", { clip: tag }));
        if (!(c.in >= 0)) issues.push(t("exportPanel.specIssueClipIn", { clip: tag }));
        if (!(c.out > c.in)) issues.push(t("exportPanel.specIssueClipOut", { clip: tag }));
      }
      if (c.kind === "text") {
        if (!c.style || !(c.style.fontSize > 0)) issues.push(t("exportPanel.specIssueFontSize", { clip: tag }));
      }
    }
  }
  return issues;
}

export function ExportPanel({ onClose }: { onClose: () => void }) {
  const lang = useLang(); // re-render khi đổi ngôn ngữ
  const spec = useStore((s) => s.spec);
  const media = useStore((s) => s.media);
  const [copied, setCopied] = useState(false);

  // --- P0-01: state xuất MP4 qua bridge ---
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle");
  const [renderProgress, setRenderProgress] = useState(0);
  // R1-065: ETA (giây, null = chưa đủ dữ liệu) + vị trí hàng đợi
  const [renderEta, setRenderEta] = useState<number | null>(null);
  const [queuePos, setQueuePos] = useState<number | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderErrorDetail, setRenderErrorDetail] = useState<RenderErrorDetail | null>(null);
  // Đợt 64 R8 — ghi chú của job (vd phục hồi sau restart): chuỗi đã
  // localize từ publicJob.noteCode/note, hiện dưới thanh tiến trình
  // trong lúc render; null = job không có note → không hiện gì.
  const [renderNote, setRenderNote] = useState<string | null>(null);
  // Đợt 65 S4 — trạng thái probe GPU (bridge GET /api/gpu-probe, chỉ đọc
  // cache đĩa) + nút "Probe lại GPU" (POST /api/gpu-probe/reprobe).
  // null = chưa tải được (bridge chưa chạy / lần đầu mở panel); msg chỉ
  // hiện sau khi user bấm nút (thành công / lỗi), không ồn khi mở panel.
  const [gpuStatus, setGpuStatus] = useState<GpuProbeStatus | null>(null);
  const [gpuProbing, setGpuProbing] = useState(false);
  const [gpuMsg, setGpuMsg] = useState<string | null>(null);
  const gpuStrings = gpuProbeStrings(lang);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/gpu-probe`);
        if (!res.ok || cancelled) return;
        setGpuStatus((await res.json()) as GpuProbeStatus);
      } catch {
        /* bridge chưa chạy: giữ trạng thái "chưa probe", không ồn */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const reprobeGpu = async () => {
    if (gpuProbing || renderStatus === "uploading" || renderStatus === "rendering") return;
    setGpuProbing(true);
    setGpuMsg(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/gpu-probe/reprobe`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as GpuProbeStatus & { encoder?: string | null };
      setGpuStatus(data);
      setGpuMsg(gpuProbeDoneText(data.encoder ?? null, lang));
    } catch (e) {
      setGpuMsg(gpuProbeErrorText(e instanceof Error ? e.message : String(e), lang));
    } finally {
      setGpuProbing(false);
    }
  };
  const [jobId, setJobId] = useState<string | null>(null);
  // Đợt 66 T8 — resume job: panel đang theo dõi một job được nối lại
  // (không phải job vừa bấm Xuất trong phiên mở này) → hiện nhãn
  // "Đã nối lại…" để user biết tiến trình không phải bắt đầu lại.
  // false lại khi bắt đầu render mới / huỷ (startRender/cancelRender).
  const [resumedJob, setResumedJob] = useState(false);
  // Đợt 66 T8 — retry job lỗi/gián đoạn đang bay (chống bấm đúp).
  const [retrying, setRetrying] = useState(false);
  // Đợt 66 T8 — jobId mà panel đang sở hữu (mirror của state jobId,
  // đọc được trong closure của effect resume): chặn resume đè lên
  // render vừa bấm Xuất trong lúc fetch danh sách job còn bay.
  const activeJobIdRef = useRef<string | null>(null);
  const resumeStrings = resumeJobStrings(lang);
  // Đợt 67 U7 — lịch sử job xuất (persist localStorage, nạp lúc mount)
  // + cờ "đang chờ job của phiên upload" (mở lại panel giữa lúc upload
  // đang bay). Lịch sử là của user: chỉ user xoá từng mục, mount hợp
  // nhất trạng thái mới nhất từ bridge chứ không tự xoá mục cũ.
  const [jobHistory, setJobHistory] = useState<JobHistoryEntry[]>(() => loadJobHistory());
  const [uploadWaiting, setUploadWaiting] = useState(false);
  const historyStrings = jobHistoryStrings(lang);
  // Đợt 68 V8 — chuỗi cụm đích export (fragment round68-v8, đọc trực
  // tiếp như mẫu U7 — không chờ gộp dict).
  const exportDestStringsForLang = exportDestStrings(lang);
  // Đợt 68 V8 — kết quả kiểm tra download của job đang done: null = chưa
  // kiểm tra / không rõ (lỗi mạng — UI giữ hành vi cũ, hiện nút); true =
  // file còn đó → hiện nút tải; false = output đã mất → ẩn nút, báo rõ.
  const [downloadAvailable, setDownloadAvailable] = useState<boolean | null>(null);
  const [downloadChecking, setDownloadChecking] = useState(false);

  /** Đợt 68 V8 — khôi phục đích .mp4 đã chọn của một job từ lịch sử đã
   *  persist (đọc lại từ kho mỗi lần nên không kẹt state cũ trong
   *  closure): mở lại từ lịch sử / resume lúc mount thì "Tải MP4" trong
   *  Electron ghi thẳng ra đích cũ thay vì rớt về anchor download. */
  const restoreExportDest = (id: string | null) => {
    if (!id) return;
    const dest = findHistoryExportDest(loadJobHistory(), id);
    if (dest) setExportDest(dest);
  };

  /** Đợt 67 U7 — ghi một job bridge vào lịch sử local + cập nhật state.
   *  Đọc lại từ kho mỗi lần nên không kẹt state cũ trong closure poll.
   *  Đợt 68 V8 — tham số exportDest (đích .mp4 đã chọn trong Electron):
   *  chỉ startRender truyền vào (lúc POST xong, jobId đã có); poll/mount
   *  không truyền thì upsert giữ đích cũ (không xoá). */
  const recordHistoryFromJob = (job: {
    id: string;
    status: string;
    progress?: number;
    createdAt?: number;
    outputName?: string | null;
    outputSize?: number | null;
    error?: string | null;
    note?: string | null;
  }, exportDest?: string | null) => {
    const e = historyEntryFromJob(job, spec.meta.name, activePreset.label, exportDest);
    if (e) setJobHistory(recordJobHistory(e));
  };
  // Phase 10 G4 — đích .mp4 đã chọn trước khi render (chỉ Electron).
  const [exportDest, setExportDest] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [shareMsg, setShareMsg] = useState<string>("");
  const pollRef = useRef<number | null>(null);

  // --- R1-042: export preset ---
  const [presetId, setPresetId] = useState<string>("1080p");
  // Đợt 73 A9 (S4): preset đổi thì báo cho preview (overlay safe-area)
  // qua exportPresetSelection; mount lần đầu cũng publish giá trị mặc định.
  useEffect(() => {
    setSelectedExportPreset(presetId);
  }, [presetId]);
  const [custom, setCustom] = useState<ExportPreset>(() => defaultCustomPreset());
  // Đợt 76 D9: cách lấp khung khi tỉ lệ nguồn lệch khung preset — "fit"
  // (giữ tỉ lệ + viền đen, mặc định) hoặc "crop" (lấp đầy + crop giữa).
  // Persist localStorage (vcut-export-aspect-fit), đọc lúc mount.
  const [aspectFit, setAspectFit] = useState<AspectFit>(() => loadAspectFit());
  // --- Phase 7 P3: normalize loudness (tùy chọn export, áp sau amix) ---
  const [normalize, setNormalize] = useState<"off" | "loudnorm" | "dynaudnorm">("off");
  const [normalizeTarget, setNormalizeTarget] = useState<number>(-14);
  // --- Đợt 68 V2: stabilize single-thread decode (đợt 67 U1) ---
  // Toggle render-time (global, không phải per-clip): BẬT = ffmpeg decode
  // clip chống rung bằng 1 luồng (mặc định U1, output ổn định hơn);
  // TẮT = decode đa luồng. Persist localStorage, gửi qua preset whitelist
  // của bridge → render.js --no-stab-single-thread khi tắt.
  const [stabSingleThread, setStabSingleThread] = useState<boolean>(() => loadStabSingleThread());
  const stabStrings = stabSingleThreadStrings(lang);

  /** Preset đang có hiệu lực (custom lấy từ form tay). */
  const activePreset: ExportPreset =
    presetId === "custom" ? { ...custom, id: "custom" } : getPreset(presetId) ?? getPreset("1080p")!;
  // Đợt 76 D9 — lệch tỉ lệ nguồn (meta project) vs khung preset: null =
  // khớp (không cảnh báo thừa), "letterbox" = nguồn rộng hơn → viền đen
  // trên/dưới, "pillarbox" = nguồn hẹp hơn → viền đen hai bên.
  const fitMismatch = useMemo(
    () => aspectMismatch(spec.meta.width, spec.meta.height, activePreset.width, activePreset.height),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spec.meta.width, spec.meta.height, activePreset],
  );
  const presetIssues = useMemo(() => validateExportPreset(activePreset), [activePreset]);
  const presetOk = presetIssues.length === 0;

  // Đợt 63 R5: dòng validator đã dịch từ errorDetail.validationDetails
  // (bridge bóc từ stderr worker). Tối đa 5 dòng hiển thị như details cũ;
  // rỗng khi payload cũ không có validationDetails → UI giữ details thô.
  const validationLines = useMemo(
    () => resolveValidationDetails(renderErrorDetail?.validationDetails, t),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderErrorDetail, lang],
  );

  const setCustomField = <K extends keyof ExportPreset>(key: K, value: ExportPreset[K]) => {
    setCustom((c) => ({ ...c, [key]: value }));
  };

  /** Lookup dịch cho các helper thuần (cùng mẫu App đợt 29 L4: lib
   *  không import i18n, UI truyền lookup vào). */
  const i18nLookup = (k: string, vars?: Record<string, string>): string => t(k, vars);

  // Phase 9 đợt 27 K2 — kiểm tra curve tốc độ TRƯỚC khi gửi bridge:
  // trước đây spec vi phạm vẫn gửi đi, render worker exit 1, bridge cắt
  // chi tiết stderr nên user chỉ thấy "Render worker thoát với mã 1."
  // (mù). Nay chặn sớm với thông báo nêu rõ clip/curve vi phạm.
  // - curveWarnings: mọi vi phạm J5 (kể cả chỉ lệch đơn điệu — render
  //   vẫn chấp nhận loại này nhờ sort + dedupe, nên chỉ hiện banner).
  // - curveBlocker: chỉ vi phạm render chặn được → chặn nút Xuất.
  const curveWarnings = useMemo(() => collectSpeedCurveWarnings(spec), [spec]);
  const curveBlocker = useMemo(() => exportCurveBlockers(spec, i18nLookup), [spec, lang]);
  const [curveFixMsg, setCurveFixMsg] = useState<string | null>(null);

  /** Nút "Sửa curve vi phạm": xin xác nhận (liệt kê từng thay đổi),
   *  rồi gọi store action — 1 bước undo, curve hợp lệ không đổi.
   *  Đợt 30 M4: confirm + tóm tắt sau sửa đều dịch theo locale hiện
   *  tại, và store action nhận tóm tắt đã dịch (trước đây ExportPanel
   *  gọi không tham số nên toast luôn tiếng Việt ở cả hai locale —
   *  nợ §3.3 của đợt 29 L4, nay đóng). Preview `res` tính trên cùng
   *  spec và confirm là đồng bộ nên tóm tắt truyền vào khớp kết quả
   *  action áp dụng ngay sau đó. */
  const fixCurves = () => {
    const st = useStore.getState();
    const res = sanitizeSpecSpeedCurves(st.spec);
    if (!res.changed && res.fixed.length === 0) {
      setCurveFixMsg(formatSanitizeSummaryLocalized(res, i18nLookup));
      return;
    }
    const lines: string[] = [t("exportPanel.fixConfirmTitle")];
    for (const f of res.fixed) {
      lines.push(`• "${f.clipId}" (${f.path}):`);
      for (const c of formatFixEntryChanges(f, i18nLookup)) lines.push(`    - ${c}`);
    }
    for (const u of res.unsalvageable) lines.push(`• "${u.clipId}" (${u.path}): ${t("loadReport.fixConfirmUnsalvageable", { reason: resolveUnsalvageableReason(u, i18nLookup) })}`);
    for (const s of res.skippedLocked) lines.push(`• "${s.clipId}" (${s.path}): ${t("loadReport.fixConfirmLocked")}`);
    lines.push(t("loadReport.fixConfirmTiming"));
    if (!window.confirm(lines.join("\n"))) return;
    const applied = st.fixSpeedCurveViolations(formatSanitizeSummaryLocalized(res, i18nLookup));
    setCurveFixMsg(formatSanitizeSummaryLocalized(applied, i18nLookup));
    setRenderError(null);
  };

  const { ok, issues, json } = useMemo(() => {
    const list: string[] = [];
    if (!isVideoSpec(spec)) {
      list.push(t("exportPanel.specBadFormat"));
    } else {
      list.push(...deepValidate(spec));
    }
    return { ok: list.length === 0, issues: list, json: JSON.stringify(spec, null, 2) };
  }, [spec, lang]);

  /** Thu thập các file media mà spec đang dùng (theo clip.src). */
  const collectMediaFiles = async (): Promise<{ files: File[]; missing: string[] }> => {
    const needed = new Set<string>();
    for (const t of spec.tracks)
      for (const c of t.clips)
        if ((c.kind === "video" || c.kind === "audio" || c.kind === "sticker") && c.src)
          needed.add(c.src);
    const files: File[] = [];
    const missing: string[] = [];
    for (const name of needed) {
      const item = media.find((m) => m.name === name);
      if (item?.file) files.push(item.file);
      else missing.push(name);
    }
    // K3: LUT user (`user-...`) dùng trong spec → upload file .cube từ
    // IndexedDB kèm theo với tên dành riêng `__lut_<id>.cube` để render
    // worker resolve từ mediaDir của job.
    const userLutIds = new Set<string>();
    for (const t of spec.tracks)
      for (const c of t.clips) {
        const lut = (c as { filter?: { lut?: string } }).filter?.lut;
        if (typeof lut === "string" && lut.startsWith("user-")) userLutIds.add(lut);
      }
    if (userLutIds.size > 0) {
      const { getUserLut, userLutFileName } = await import("./lib/userLut");
      for (const id of userLutIds) {
        const lut = await getUserLut(id);
        if (!lut) {
          missing.push(t("exportPanel.userLutMissing", { name: id }));
          continue;
        }
        files.push(
          new File([lut.text], userLutFileName(id), { type: "text/plain" }),
        );
      }
    }
    return { files, missing };
  };

  const startRender = async () => {
    if (!ok || !presetOk || renderStatus === "uploading" || renderStatus === "rendering") return;
    // Đợt 66 T8: bắt đầu render mới thì job cũ không còn hiệu lực —
    // xoá jobId cũ ngay để nút "Render lại"/tải MP4 không trỏ nhầm
    // job cũ khi lần render này lỗi trước khi POST (vd thiếu media,
    // curve vi phạm). Đặt trước mọi early-return dưới đây.
    setJobId(null);
    activeJobIdRef.current = null;
    setResumedJob(false);
    // Đợt 27 K2 — chặn sớm thay vì gửi spec vi phạm đi rồi nhận lỗi mù
    // từ bridge ("Render worker thoát với mã 1."). Thông báo nêu rõ
    // clip/curve vi phạm + nhắc nút sửa (không tự sửa lén).
    if (curveBlocker !== null) {
      setRenderStatus("error");
      setRenderError(curveBlocker);
      setRenderErrorDetail(null);
      return;
    }
    // Phase 10 G4 — trong Electron, hỏi đích .mp4 TRƯỚC khi render;
    // user huỷ dialog thì không bắt đầu render (không tốn công render
    // rồi mới hỏi). Ngoài Electron, đích là tải xuống qua trình duyệt.
    // Đợt 68 V8 — giữ đích đã chọn trong biến cục bộ để ghi vào lịch sử
    // cùng jobId khi POST xong (state setExportDest chưa chắc đã flush
    // trong closure này — ghi sai đích là mất đích).
    let pickedDest: string | null = null;
    if (isNativeDesktop()) {
      const dest = await pickExportDestinationNative();
      if (!dest) {
        pushToast(t("nativeFiles.exportCancelled"), "info");
        return;
      }
      pickedDest = dest;
      setExportDest(dest);
    } else {
      setExportDest(null);
    }
    setRenderError(null);
    setRenderErrorDetail(null);
    setRenderNote(null); // Đợt 64 R8: job mới chưa có note
    setRenderProgress(0);
    setRenderEta(null); // R1-065
    setQueuePos(null);  // R1-065

    const { files, missing } = await collectMediaFiles();
    if (missing.length > 0) {
      setRenderStatus("error");
      setRenderError(t("exportPanel.missingMedia", { files: missing.join(", ") }));
      setRenderErrorDetail(null);
      return;
    }

    setRenderStatus("uploading");
    // Đợt 67 U7 — phiên upload persist: ghi TRƯỚC khi POST để đóng
    // panel giữa lúc upload thì lần mở sau vẫn chờ được job (không POST
    // lại, không nhân đôi). Xoá ở 2 đầu ra dưới đây (POST xong / lỗi).
    let uploadSession: UploadSession | null = null;
    try {
      // Đợt 67 U7 — bắt đầu phiên upload (ghi localStorage ngay).
      uploadSession = beginUploadSession({
        startedAt: Date.now(),
        projectName: spec.meta.name || null,
        presetLabel: activePreset.label,
        mediaNames: files.map((f) => f.name),
      });
      // R1-042: clone spec, override meta theo preset (project gốc không đổi).
      const renderSpec: VideoSpec = {
        ...spec,
        meta: {
          ...spec.meta,
          width: activePreset.width,
          height: activePreset.height,
          fps: activePreset.fps,
        },
      };
      const form = new FormData();
      form.append("spec", JSON.stringify(renderSpec));
      form.append("preset", JSON.stringify({
        crf: activePreset.crf,
        x264Preset: activePreset.x264Preset,
        audioBitrateKbps: activePreset.audioBitrateKbps,
        // Đợt 80 H10 (S4): trần bitrate video của preset mạng xã hội
        // (bridge whitelist kiểm tra lại; undefined → JSON bỏ field,
        // render.js chỉ CRF như trước).
        videoBitrateKbps: activePreset.videoBitrateKbps,
        // Phase 7 P3: normalize export (bridge whitelist kiểm tra lại).
        normalize,
        normalizeTarget,
        // Đợt 68 V2: stabilize single-thread decode (bridge whitelist kiểm
        // tra lại; false → render.js --no-stab-single-thread).
        stabSingleThread,
        // Đợt 76 D9: cách lấp khung (bridge whitelist kiểm tra lại;
        // crop → render.js --aspect-fit crop, fit là mặc định).
        aspectFit,
      }));
      for (const f of files) form.append("media", f, f.name);

      const res = await fetch(`${BRIDGE_URL}/api/render`, { method: "POST", body: form });
      // Đợt 62 R5: 429 có mã (RATE_LIMITED / QUEUE_FULL) thì dịch mã,
      // 429 không mã mới dùng bridgeBusy như trước.
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(resolveBridgeApiError(
          body,
          t,
          res.status === 429
            ? t("exportPanel.bridgeBusy")
            : t("exportPanel.bridgeError", { status: String(res.status) }),
        ));
      }
      const { jobId: id } = await res.json();
      // Đợt 67 U7 — POST xong, job đã có trên bridge: xoá session (kẻo
      // lần mở sau chờ job mới nữa) + ghi lịch sử (đang xếp hàng). Ghi
      // localStorage TRƯỚC setState để kể cả khi panel đã đóng giữa lúc
      // upload thì lịch sử vẫn có job (fetch không bị huỷ khi unmount).
      clearUploadSession();
      uploadSession = null;
      // Đợt 68 V8 — ghi đích đã chọn cùng jobId vào lịch sử (bền qua
      // reopen): mở lại từ lịch sử thì tải MP4 ghi thẳng ra đích này.
      recordHistoryFromJob({ id, status: "queued", progress: 0, createdAt: Date.now() }, pickedDest);
      setJobId(id);
      activeJobIdRef.current = id; // Đợt 66 T8: chặn resume đè lên job mới
      setRenderStatus("rendering");
      pollStatus(id);
    } catch (e) {
      // Đợt 67 U7 — POST upload thất bại (kể cả khi panel đã đóng giữa
      // lúc upload — catch vẫn chạy vì fetch không bị huỷ khi unmount):
      // xoá session + ghi mục lỗi upload vào lịch sử để lần mở sau thấy
      // rõ thay vì lặng lẽ về idle.
      if (uploadSession) {
        const failedAt = uploadSession.startedAt;
        const failedProject = uploadSession.projectName;
        const failedPreset = uploadSession.presetLabel;
        const uploadError =
          e instanceof Error
            ? e.message
            : t("exportPanel.bridgeConnHint", { url: BRIDGE_URL });
        clearUploadSession();
        uploadSession = null;
        setJobHistory(recordJobHistory({
          id: `upload-${failedAt}`,
          jobId: null,
          kind: "upload",
          status: "error",
          progress: 0,
          createdAt: failedAt,
          updatedAt: Date.now(),
          projectName: failedProject,
          presetLabel: failedPreset,
          outputName: null,
          outputSize: null,
          error: uploadError,
          note: null,
        }));
      }
      setRenderStatus("error");
      setRenderError(
        e instanceof Error
          ? e.message
          : t("exportPanel.bridgeConnHint", { url: BRIDGE_URL }),
      );
    }
  };

  const pollStatus = (id: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        // Đợt 29 L3: poll kèm ?detail=1 để nhận errorDetail đã redact
        // khi job lỗi; job không lỗi thì field này vắng (không đổi hành vi).
        const res = await fetch(`${BRIDGE_URL}/api/render/${id}?detail=1`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        setRenderProgress(data.progress ?? 0);
        // R1-065: ETA + vị trí hàng đợi
        setRenderEta(typeof data.etaSeconds === "number" ? data.etaSeconds : null);
        setQueuePos(typeof data.queuePosition === "number" ? data.queuePosition : null);
        // Đợt 64 R8: ghi chú của job (vd phục hồi sau restart) — resolve
        // theo noteCode (localize) rồi rớt xuống chuỗi note thô; "" → null
        // nên job không có note thì khối tiến trình không hiện gì thêm.
        // Dùng getLang() (đọc locale HIỆN TẠI lúc poll) thay vì biến
        // `lang` trong closure: interval giữ closure cũ từ lúc startRender
        // nên đổi locale giữa chừng vẫn dịch lại note ở poll sau (≤1s).
        setRenderNote(resolveJobNote(data.noteCode, data.note, getLang()) || null);
        if (data.status === "done") {
          stopPolling();
          setRenderStatus("done");
          recordHistoryFromJob(data); // Đợt 67 U7: job xong → lịch sử
        } else if (data.status === "error") {
          stopPolling();
          setRenderStatus("error");
          // Giữ nguyên error cũ làm thông báo mặc định; detail chỉ là
          // phần mở rộng (summary + dòng lỗi đã redact), không thay error.
          // Đợt 62 R5: chỉ dịch mã bridgeErrors ở dòng chính (vd job phục
          // hồi sau restart) — detail panel đã hiển thị summary nên poll
          // không dịch summary lần nữa (useErrorDetailSummary: false).
          setRenderError(resolveBridgeApiError(data, t, t("errorDetail.summary.unknown"), { useErrorDetailSummary: false }));
          setRenderErrorDetail(
            data.errorDetail && typeof data.errorDetail.summary === "string"
              ? (data.errorDetail as RenderErrorDetail)
              : null,
          );
          recordHistoryFromJob(data); // Đợt 67 U7: job lỗi → lịch sử
        } else if (data.status === "interrupted") {
          // Đợt 67 U7 — nhánh terminal cho `interrupted` (nợ T8 §5.3):
          // trước đây poll không xử lý trạng thái này nên kẹt poll mãi
          // với note cũ trong khi bridge đã đánh dấu job gián đoạn sau
          // restart. Nay dừng poll, hiện lỗi + note phục hồi + nút
          // "Render lại" (như job lỗi khi mở lại panel, T8) + ghi lịch sử.
          // resolveBridgeApiError dịch sẵn mã JOB_INTERRUPTED_BY_RESTART
          // (dict bridgeErrors.*); errorDetail kèm khi poll ?detail=1.
          stopPolling();
          setRenderStatus("error");
          setRenderError(resolveBridgeApiError(data, t, t("errorDetail.summary.unknown"), { useErrorDetailSummary: false }));
          setRenderErrorDetail(
            data.errorDetail && typeof data.errorDetail.summary === "string"
              ? (data.errorDetail as RenderErrorDetail)
              : null,
          );
          recordHistoryFromJob(data);
        } else if (data.status === "cancelled") {
          stopPolling();
          setRenderStatus("cancelled");
          recordHistoryFromJob(data); // Đợt 67 U7: job huỷ → lịch sử
        }
      } catch {
        // giữ polling, có thể bridge lag tạm thời
      }
    }, 1000); // R1-065: poll mỗi 1s cho tiến trình mượt hơn
  };

  const stopPolling = () => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
  };

  // --- Đợt 66 T8: resume job khi mở lại panel (đóng nợ S10 đợt 65) ---
  // Trước đây jobId chỉ là state của component: đóng modal là mất,
  // mở lại panel về idle dù bridge vẫn đang render. Nay lúc mount,
  // panel hỏi bridge job mới nhất (GET /api/render, mới nhất trước)
  // rồi nối lại: job đang chạy/xếp hàng → theo dõi tiếp; job lỗi/
  // gián đoạn mới nhất → hiện lỗi + note + nút "Render lại"; còn lại
  // (done/cancelled/không có job) → mở idle như cũ.
  const applyResumedJob = (job: ResumableRenderJob) => {
    setJobId(job.id);
    activeJobIdRef.current = job.id;
    // Note phục hồi (vd JOB_RECOVERED_RESTART) hiện lại như lúc job
    // đang chạy — resolve theo locale hiện tại (mẫu pollStatus R8/S10).
    setRenderNote(resolveJobNote(job.noteCode, job.note, getLang()) || null);
    if (job.status === "running" || job.status === "queued") {
      setRenderStatus("rendering");
      setRenderProgress(typeof job.progress === "number" ? job.progress : 0);
      setRenderEta(typeof job.etaSeconds === "number" ? job.etaSeconds : null);
      setQueuePos(typeof job.queuePosition === "number" ? job.queuePosition : null);
      setRenderError(null);
      setRenderErrorDetail(null);
      setResumedJob(true);
      pollStatus(job.id);
    } else {
      // error / interrupted: hiện trạng thái lỗi + note, không poll
      // (job đã ở trạng thái cuối) — user bấm "Render lại" để chạy tiếp.
      setRenderStatus("error");
      setRenderProgress(typeof job.progress === "number" ? job.progress : 0);
      setRenderEta(null);
      setQueuePos(null);
      setRenderError(resolveBridgeApiError(job, t, t("errorDetail.summary.unknown"), { useErrorDetailSummary: false }));
      const detail = (job as unknown as { errorDetail?: RenderErrorDetail }).errorDetail;
      setRenderErrorDetail(
        detail && typeof detail.summary === "string" ? detail : null,
      );
      setResumedJob(true);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/render?limit=10`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const jobs = Array.isArray(data?.jobs) ? (data.jobs as ResumableRenderJob[]) : [];
        // Đợt 67 U7 — hợp nhất danh sách bridge vào lịch sử local (job
        // done cũ vẫn hiện để mở lại kết quả; trạng thái mới nhất thắng;
        // mục local không còn trên bridge thì giữ nguyên — lịch sử là của
        // user, chỉ user xoá).
        if (jobs.length > 0 && !cancelled) {
          let merged = loadJobHistory();
          for (const j of jobs) {
            const e = historyEntryFromJob(j, spec.meta.name, activePreset.label);
            if (e) merged = upsertHistoryEntry(merged, e);
          }
          persistJobHistory(merged);
          setJobHistory(merged);
        }
        const candidate = pickResumeCandidate(jobs);
        if (!candidate) {
          // Đợt 67 U7 — không có job nối được nhưng còn phiên upload
          // đang bay (đóng panel giữa lúc upload): chờ job xuất hiện
          // trên bridge rồi nối tiếp, KHÔNG POST lại (không nhân đôi
          // upload; nút Xuất bị disable trong lúc chờ vì renderStatus
          // đang "uploading").
          if (cancelled) return;
          if (activeJobIdRef.current !== null || pollRef.current !== null) return;
          const session = readUploadSession();
          if (!session) return;
          if (isUploadSessionStale(session)) { clearUploadSession(); return; }
          setRenderStatus("uploading");
          setUploadWaiting(true);
          const deadline = Date.now() + UPLOAD_WAIT_TIMEOUT_MS;
          while (Date.now() < deadline) {
            if (cancelled) return;
            try {
              const listRes = await fetch(`${BRIDGE_URL}/api/render?limit=10`);
              if (listRes.ok) {
                const listData = await listRes.json();
                const found = findJobCreatedAfter(
                  Array.isArray(listData?.jobs) ? listData.jobs : [],
                  session.startedAt,
                );
                if (found) {
                  clearUploadSession();
                  setUploadWaiting(false);
                  const detailRes = await fetch(`${BRIDGE_URL}/api/render/${found.id}?detail=1`);
                  if (!detailRes.ok || cancelled) return;
                  const job = (await detailRes.json()) as ResumableRenderJob;
                  if (cancelled) return;
                  if (activeJobIdRef.current !== null || pollRef.current !== null) return;
                  if (job.status === "done") {
                    // Upload xong + render xong luôn trong lúc chờ:
                    // mở thẳng kết quả thay vì nối tiến trình.
                    recordHistoryFromJob(job);
                    // Đợt 68 V8 — khôi phục đích đã chọn (Electron) để
                    // tải MP4 ghi thẳng ra đích cũ sau reopen.
                    restoreExportDest(job.id);
                    setJobId(job.id);
                    activeJobIdRef.current = job.id;
                    setRenderStatus("done");
                    setRenderProgress(1);
                    setRenderEta(null);
                    setQueuePos(null);
                    setRenderError(null);
                    setRenderErrorDetail(null);
                    setRenderNote(resolveJobNote(job.noteCode, job.note, getLang()) || null);
                    setResumedJob(false);
                  } else if (job.status === "running" || job.status === "queued" || job.status === "error" || job.status === "interrupted") {
                    // Đợt 68 V8 — khôi phục đích đã chọn để khi job xong,
                    // tải MP4 ghi thẳng ra đích cũ (Electron).
                    restoreExportDest(job.id);
                    applyResumedJob(job);
                  } else {
                    // cancelled: job đã bị huỷ trước khi nối — ghi lịch
                    // sử rồi về idle, không hiện banner done giả.
                    recordHistoryFromJob(job);
                    setRenderStatus("idle");
                  }
                  return;
                }
              }
            } catch {
              // bridge chưa lên lại — chờ tiếp tới hạn
            }
            await new Promise((r) => setTimeout(r, 2000));
          }
          // Hết 120s không thấy job: phiên upload coi như chết (tab đã
          // đóng giữa lúc upload / bridge mất job) → xoá session, về idle.
          clearUploadSession();
          setUploadWaiting(false);
          if (!cancelled) setRenderStatus("idle");
          return;
        }
        if (cancelled) return;
        // Phiên upload của chính job ứng viên này (POST đã xong nhưng
        // panel đóng trước khi handler kịp xoá): dọn session để lần mở
        // sau không chờ job mới nữa.
        const session = readUploadSession();
        if (
          session &&
          typeof candidate.job.createdAt === "number" &&
          candidate.job.createdAt >= session.startedAt - UPLOAD_JOB_MATCH_TOLERANCE_MS
        ) {
          clearUploadSession();
        }
        // User đã bấm Xuất trong lúc fetch còn bay → render mới đã có
        // chủ, không đè bằng job cũ (pollStatus của render mới clear
        // interval cũ nên cuối cùng vẫn đúng — chặn ở đây để khỏi nháy UI).
        if (activeJobIdRef.current !== null || pollRef.current !== null) return;
        // Lấy chi tiết đầy đủ: errorDetail chỉ có ở ?detail=1, và job
        // có thể đã đổi trạng thái giữa 2 lần fetch nên kiểm tra lại
        // trước khi áp (tránh nối nhầm job vừa xong/lỗi khác).
        const detailRes = await fetch(`${BRIDGE_URL}/api/render/${candidate.job.id}?detail=1`);
        if (!detailRes.ok || cancelled) return;
        const job = (await detailRes.json()) as ResumableRenderJob;
        if (cancelled) return;
        if (activeJobIdRef.current !== null || pollRef.current !== null) return;
        if (job.status !== "running" && job.status !== "queued" && job.status !== "error" && job.status !== "interrupted") return;
        // Đợt 68 V8 — khôi phục đích đã chọn (Electron) để khi job xong,
        // tải MP4 ghi thẳng ra đích cũ thay vì rớt về anchor download.
        restoreExportDest(job.id);
        applyResumedJob(job);
      } catch {
        // bridge chưa chạy / mất mạng lúc mở panel: mở idle như cũ,
        // không ồn (cùng cách xử lý với fetch gpu-probe ở trên).
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đợt 66 T8 — mở lại panel giữa lúc render thì cuộn tới khối tiến
  // trình / banner lỗi để user thấy ngay trạng thái job: nội dung modal
  // dài nên khối này thường nằm dưới fold ở viewport thấp (ảnh chụp
  // headed lượt chạy 1 cho thấy panel đã resume nhưng progress khuất
  // dưới fold). Chỉ chạy khi resumedJob vừa bật (deps [resumedJob]) —
  // không cuộn lại khi job xong hay khi user tự mở panel lúc idle.
  // Mẫu scrollIntoView đã có ở TourCard.tsx (document.querySelector).
  useEffect(() => {
    if (!resumedJob) return;
    const target =
      document.querySelector(".render-progress") ??
      document.querySelector(".mp4-export .valid-banner.bad");
    target?.scrollIntoView({ block: "center" });
  }, [resumedJob]);

  /** Đợt 67 U7 — phần chung sau khi POST retry thành công (dùng cho
   *  cả retryRender T8 lẫn retryHistoryJob): lấy trạng thái mới của job
   *  rồi poll tiếp như render thường. */
  const refreshJobAfterRetry = async (id: string) => {
    const fresh = await fetch(`${BRIDGE_URL}/api/render/${id}?detail=1`);
    if (!fresh.ok) throw new Error(`status ${fresh.status}`);
    const job = (await fresh.json()) as ResumableRenderJob;
    setRenderError(null);
    setRenderErrorDetail(null);
    setRenderStatus("rendering");
    setRenderProgress(typeof job.progress === "number" ? job.progress : 0);
    setRenderEta(typeof job.etaSeconds === "number" ? job.etaSeconds : null);
    setQueuePos(typeof job.queuePosition === "number" ? job.queuePosition : null);
    setRenderNote(resolveJobNote(job.noteCode, job.note, getLang()) || null);
    pollStatus(job.id);
  };

  /** Đợt 66 T8 — chạy lại job lỗi/gián đoạn (endpoint bridge đã có):
   *  POST retry → job về queued → lấy trạng thái mới rồi poll tiếp
   *  như render thường. Lỗi retry (vd thư mục job đã bị dọn → 409
   *  JOB_GONE) hiện như lỗi render thường, không crash. */
  const retryRender = async () => {
    if (!jobId || retrying) return;
    setRetrying(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/render/${jobId}/retry`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(resolveBridgeApiError(
          body,
          t,
          t("exportPanel.bridgeError", { status: String(res.status) }),
        ));
      }
      await refreshJobAfterRetry(jobId);
    } catch (e) {
      setRenderError(
        e instanceof Error
          ? e.message
          : t("exportPanel.bridgeError", { status: "?" }),
      );
    } finally {
      setRetrying(false);
    }
  };

  /** Đợt 67 U7 — chạy lại job lỗi/gián đoạn từ một mục lịch sử (nút
   *  "Render lại" trên dòng lịch sử). Tách khỏi retryRender để giữ
   *  nguyên literal `${jobId}` mà test T8 khóa; URL dựng bằng nối chuỗi
   *  (cùng endpoint retry của bridge) rồi dùng chung
   *  refreshJobAfterRetry. Lỗi retry (vd job đã bị dọn → 409 JOB_GONE)
   *  hiện như lỗi render thường, không crash. */
  const retryHistoryJob = async (entry: JobHistoryEntry) => {
    if (!entry.jobId || retrying) return;
    setRetrying(true);
    try {
      const res = await fetch(BRIDGE_URL + "/api/render/" + entry.jobId + "/retry", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(resolveBridgeApiError(
          body,
          t,
          t("exportPanel.bridgeError", { status: String(res.status) }),
        ));
      }
      setJobId(entry.jobId);
      activeJobIdRef.current = entry.jobId;
      setResumedJob(false);
      await refreshJobAfterRetry(entry.jobId);
    } catch (e) {
      setRenderError(
        e instanceof Error
          ? e.message
          : t("exportPanel.bridgeError", { status: "?" }),
      );
    } finally {
      setRetrying(false);
    }
  };

  /** Đợt 67 U7 — mở một job từ lịch sử: lấy trạng thái THẬT từ bridge
   *  rồi hiện đúng trạng thái đó (không idle mù như T8 §5.1):
   *  done → banner tải MP4; running/queued/error/interrupted → nối tiếp
   *  như resume (T8); cancelled → tip đã huỷ. Job không còn trên bridge
   *  (404) thì xoá khỏi lịch sử + báo rõ (đã bị dọn), không hiện banner
   *  done giả. */
  const openHistoryEntry = async (entry: JobHistoryEntry) => {
    if (!entry.jobId) return;
    try {
      const res = await fetch(`${BRIDGE_URL}/api/render/${entry.jobId}?detail=1`);
      if (!res.ok) {
        if (res.status === 404) {
          setJobHistory(removeJobHistory(entry.id));
          setRenderError(historyStrings.gone || t("exportPanel.bridgeError", { status: "404" }));
          setRenderStatus("error");
          return;
        }
        throw new Error(`status ${res.status}`);
      }
      const job = (await res.json()) as ResumableRenderJob;
      recordHistoryFromJob(job);
      // Đợt 68 V8 — khôi phục đích .mp4 đã chọn của job này (Electron):
      // mở lại từ lịch sử thì "Tải MP4" ghi thẳng ra đích cũ thay vì
      // rớt về anchor download. Web thường: entry.exportDest null → về null.
      setExportDest(entry.exportDest ?? null);
      if (job.status === "done") {
        setJobId(job.id);
        activeJobIdRef.current = job.id;
        setRenderStatus("done");
        setRenderProgress(1);
        setRenderEta(null);
        setQueuePos(null);
        setRenderError(null);
        setRenderErrorDetail(null);
        setRenderNote(resolveJobNote(job.noteCode, job.note, getLang()) || null);
        setResumedJob(false);
        setUploadWaiting(false);
        setTimeout(() => document.querySelector(".mp4-export .valid-banner.ok")?.scrollIntoView({ block: "center" }), 50);
      } else if (job.status === "running" || job.status === "queued" || job.status === "error" || job.status === "interrupted") {
        applyResumedJob(job);
      } else {
        // cancelled (hoặc trạng thái lạ): hiện đúng trạng thái, không
        // banner done giả; jobId giữ để user vẫn thấy dòng lịch sử.
        setJobId(job.id);
        activeJobIdRef.current = job.id;
        setRenderStatus("cancelled");
        setRenderNote(null);
      }
    } catch (e) {
      setRenderError(
        e instanceof Error
          ? e.message
          : t("exportPanel.bridgeError", { status: "?" }),
      );
    }
  };

  /** Đợt 67 U7 — xoá một mục khỏi lịch sử (persist ngay). */
  const deleteHistoryJob = (entry: JobHistoryEntry) => {
    setJobHistory(removeJobHistory(entry.id));
  };

  const cancelRender = async () => {
    stopPolling();
    setRenderNote(null); // Đợt 64 R8: huỷ render thì dọn note cùng job
    activeJobIdRef.current = null; // Đợt 66 T8: job đã huỷ, không resume
    setResumedJob(false);
    if (jobId) {
      // Đợt 67 U7 — ghi lịch sử huỷ (kể cả khi DELETE tới bridge lỗi;
      // upsert giữ createdAt gốc nếu job đã có trong lịch sử).
      recordHistoryFromJob({ id: jobId, status: "cancelled", progress: renderProgress, createdAt: Date.now() });
      try { await fetch(`${BRIDGE_URL}/api/render/${jobId}`, { method: "DELETE" }); } catch {}
    }
    setRenderStatus("cancelled");
    setJobId(null);
  };

  const downloadMp4 = () => {
    if (!jobId) return;
    // Phase 10 G4 — trong Electron, main stream MP4 đã render về đích
    // đã chọn trước đó (không qua anchor download của trình duyệt).
    // Đợt 68 V8 — exportDest ở đây có thể là đích đã KHÔI PHỤC từ lịch
    // sử (mở lại sau reopen), không chỉ đích vừa chọn trong phiên này.
    if (isNativeDesktop() && exportDest) {
      void saveExportNative(jobId, exportDest);
      return;
    }
    const a = document.createElement("a");
    a.href = `${BRIDGE_URL}/api/render/${jobId}/download`;
    const safe = (spec.meta.name || "project").replace(/[^\w\- ]+/g, "").trim() || "project";
    a.download = `${safe}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /** Đợt 68 V8 — job done nhưng file output đã mất: xoá mục khỏi lịch sử
   *  (persist ngay) rồi về idle; không hiện anchor lỗi nữa. */
  const deleteMissingDownload = () => {
    if (!jobId) return;
    setJobHistory(removeJobHistory(jobId));
    setJobId(null);
    activeJobIdRef.current = null;
    setRenderStatus("idle");
    setDownloadAvailable(null);
    setDownloadChecking(false);
    setExportDest(null);
  };

  // Đợt 68 V8 — kiểm tra download được TRƯỚC khi hiện nút tải: job vừa
  // về done thì HEAD endpoint download; chỉ khi file còn đó mới hiện
  // nút (tránh anchor nhận JSON lỗi 409 khi output đã mất). Reset mỗi
  // khi job/trạng thái đổi để lần done sau kiểm tra lại từ đầu.
  // "unknown" (lỗi mạng thoáng qua) → giữ hành vi cũ, hiện nút.
  useEffect(() => {
    if (renderStatus !== "done" || !jobId) {
      setDownloadAvailable(null);
      setDownloadChecking(false);
      return;
    }
    let cancelled = false;
    setDownloadChecking(true);
    setDownloadAvailable(null);
    void checkDownloadAvailable(BRIDGE_URL, jobId).then((res: DownloadAvailability) => {
      if (cancelled) return;
      setDownloadChecking(false);
      setDownloadAvailable(res === "available" ? true : res === "missing" ? false : null);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderStatus, jobId]);

  /** Q7: Xuất trang chia sẻ HTML tĩnh từ video vừa render xong. */
  const doExportSharePage = async () => {
    if (!jobId) return;
    setShareStatus("working");
    setShareMsg(t("exportPanel.sharePacking"));
    try {
      const res = await fetch(`${BRIDGE_URL}/api/render/${jobId}/download`);
      if (!res.ok) throw new Error(t("exportPanel.shareDownloadFailed", { status: String(res.status) }));
      const blob = await res.blob();
      const title = spec.meta.name || "Video VCut";
      if (blob.size > SHARE_EMBED_MAX_BYTES) {
        // Video lớn: trang linked + nhắc user tải MP4 đặt cạnh.
        const { html, warnings } = buildSharePage({
          title, spec, videoMime: "video/mp4", videoFileName: "video.mp4",
        });
        downloadSharePage(html, title);
        setShareStatus("done");
        setShareMsg(
          t("exportPanel.shareLinked", {
            size: (blob.size / 1048576).toFixed(0),
            warnings: warnings.join(" "),
          }),
        );
        return;
      }
      const buf = new Uint8Array(await blob.arrayBuffer());
      // btoa theo chunk để không tràn stack với video vài chục MB.
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < buf.length; i += CHUNK) {
        binary += String.fromCharCode(...buf.subarray(i, i + CHUNK));
      }
      const { html, warnings } = buildSharePage({
        title, spec, videoMime: "video/mp4", videoBase64: btoa(binary),
      });
      downloadSharePage(html, title);
      setShareStatus("done");
      setShareMsg(
        t("exportPanel.shareDone", {
          size: (blob.size / 1048576).toFixed(1),
          warnings: warnings.join(" "),
        }),
      );
    } catch (e) {
      setShareStatus("error");
      setShareMsg(t("exportPanel.shareFailed", { error: (e as Error).message }));
    }
  };

  // Dọn polling khi đóng panel
  const handleClose = () => { stopPolling(); onClose(); };

  const download = () => {
    if (!ok) return;
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safe = (spec.meta.name || "project").replace(/[^\w\- ]+/g, "").trim() || "project";
    a.download = `${safe}.videospec.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const dur = projectDuration(spec);
  const clipCount = spec.tracks.reduce((n, t) => n + t.clips.length, 0);

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("exportPanel.title")}
      >
        <div className="modal-head">
          <span>{t("exportPanel.titleIcon")}</span>
          <button className="icon-btn" onClick={handleClose} title={t("common.close")} aria-label={t("common.close")}>×</button>
        </div>

        <div className={`valid-banner ${ok ? "ok" : "bad"}`}>
          {ok ? (
            <>{t("exportPanel.specValid", { version: String(SPEC_VERSION) })}</>
          ) : (
            <>{t("exportPanel.specInvalid")}</>
          )}
        </div>

        <div className="export-stats">
          <div><span>{t("inspector.duration")}</span><b>{fmtTime(dur)}</b></div>
          <div><span>Track</span><b>{spec.tracks.length}</b></div>
          <div><span>Clip</span><b>{clipCount}</b></div>
        </div>

        {issues.length > 0 && (
          <ul className="issues">
            {issues.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        )}

        {/* --- P0-01: Xuất MP4 qua bridge --- */}
        <div className="mp4-export">
          <div className="panel-head">{t("exportPanel.mp4Title")}</div>

          {/* --- R1-042: Export presets --- */}
          <div className="preset-row">
            <label htmlFor="export-preset">{t("exportPanel.quality")}</label>
            <select
              id="export-preset"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              disabled={renderStatus === "uploading" || renderStatus === "rendering"}
            >
              {EXPORT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          {presetId !== "custom" && (
            <p className="tips preset-desc">
              {activePreset.description} — <code>{presetSummary(activePreset)}</code>
            </p>
          )}
          {presetId === "custom" && (
            <div className="preset-grid">
              <label>Width
                <input type="number" min={16} max={7680} step={2}
                  value={custom.width}
                  onChange={(e) => setCustomField("width", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>Height
                <input type="number" min={16} max={7680} step={2}
                  value={custom.height}
                  onChange={(e) => setCustomField("height", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>FPS
                <input type="number" min={1} max={120}
                  value={custom.fps}
                  onChange={(e) => setCustomField("fps", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>{t("exportPanel.crfLabel")}
                <input type="number" min={0} max={51}
                  value={custom.crf}
                  onChange={(e) => setCustomField("crf", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>x264 preset
                <select
                  value={custom.x264Preset}
                  onChange={(e) => setCustomField("x264Preset", e.target.value as X264Preset)}
                >
                  {X264_PRESETS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>Audio (kbps)
                <input type="number" min={32} max={512} step={32}
                  value={custom.audioBitrateKbps}
                  onChange={(e) => setCustomField("audioBitrateKbps", Math.round(Number(e.target.value) || 0))} />
              </label>
            </div>
          )}
          {!presetOk && (
            <ul className="issues">
              {presetIssues.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          )}
          {presetOk && (
            <p className="tips preset-desc">
              {t("exportPanel.willExport")} <code>{presetSummary(activePreset)}</code>
              {presetId !== "custom" || (
                <> {t("exportPanel.presetNote")}</>
              )}
            </p>
          )}
          {/* --- Đợt 76 D9: cảnh báo letterbox + chọn cách lấp khung ---
              Chỉ hiện khi tỉ lệ nguồn lệch khung preset (fitMismatch !==
              null): nguồn đã khớp tỉ lệ (vd 4:5 → 4:5) thì không cảnh báo
              thừa. Mặc định "fit" (giữ hành vi cũ, có viền đen); user đổi
              sang "crop" thì render lấp đầy khung, mất phần hình ngoài. */}
          {fitMismatch !== null && (
            <div data-testid="aspect-fit-warning" role="alert">
              <p className="tips">
                {t(
                  fitMismatch === "letterbox"
                    ? "exportPanel.aspectFitWarnLetterbox"
                    : "exportPanel.aspectFitWarnPillarbox",
                  {
                    src: aspectRatioLabel(spec.meta.width, spec.meta.height),
                    dst: aspectRatioLabel(activePreset.width, activePreset.height),
                  },
                )}
              </p>
              <div className="preset-row">
                <label htmlFor="export-aspect-fit">{t("exportPanel.aspectFitLabel")}</label>
                <select
                  id="export-aspect-fit"
                  value={aspectFit}
                  onChange={(e) => {
                    const v = normalizeAspectFit(e.target.value);
                    setAspectFit(v);
                    saveAspectFit(v);
                  }}
                  disabled={renderStatus === "uploading" || renderStatus === "rendering"}
                >
                  <option value="fit">{t("exportPanel.aspectFitFit")}</option>
                  <option value="crop">{t("exportPanel.aspectFitCrop")}</option>
                </select>
              </div>
              {aspectFit === "crop" && (
                <p className="tips">{t("exportPanel.aspectFitCropHint")}</p>
              )}
            </div>
          )}
          {/* --- R1-064: ước tính dung lượng file xuất --- */}
          {presetOk && ok && (
            <p className="tips preset-desc">
              {t("exportPanel.sizeEstimate")} <b>{formatBytes(estimateSize(activePreset, dur))}</b>
              {" "}<span title={t("exportPanel.sizeEstimateHint")}>{t("exportPanel.sizeEstimateShort")}</span>
            </p>
          )}

          {/* --- Phase 7 P3: Chuẩn hoá âm thanh (normalize) --- */}
          <div className="preset-row">
            <label htmlFor="export-normalize">{t("exportPanel.normalize")}</label>
            <select
              id="export-normalize"
              value={normalize}
              onChange={(e) => setNormalize(e.target.value as "off" | "loudnorm" | "dynaudnorm")}
              disabled={renderStatus === "uploading" || renderStatus === "rendering"}
            >
              <option value="off">{t("exportPanel.normalizeOff")}</option>
              <option value="loudnorm">{t("exportPanel.normalizeLoudnorm")}</option>
              <option value="dynaudnorm">{t("exportPanel.normalizeDynaudnorm")}</option>
            </select>
          </div>
          {normalize === "loudnorm" && (
            <div className="preset-row">
              <label htmlFor="export-normalize-target">Target (LUFS):</label>
              <input
                id="export-normalize-target"
                type="number" min={-70} max={0} step={1}
                value={normalizeTarget}
                onChange={(e) => setNormalizeTarget(Number(e.target.value) || -14)}
                disabled={renderStatus === "uploading" || renderStatus === "rendering"}
              />
              <p className="tips preset-desc">{t("exportPanel.ebruNote")}</p>
            </div>
          )}

          {/* --- Đợt 68 V2: Stabilize single-thread decode (đợt 67 U1) ---
              Toggle render-time, đặt cạnh normalize vì cùng là tùy chọn lúc
              xuất (không phải thuộc tính per-clip như EnhancePanel): BẬT =
              ffmpeg decode clip chống rung bằng 1 luồng (mặc định U1,
              output ổn định hơn giữa các lần render); TẮT = decode đa luồng.
              Persist localStorage (vcut-stab-single-thread), gửi qua preset
              whitelist của bridge → render.js --no-stab-single-thread. */}
          <div className="preset-row">
            {/* Đợt 69 W3: bỏ class mask-check — class này chỉ có rule scoped
                `.mask-panel .mask-check` (mask.css) nên ở ExportPanel (ngoài
                .mask-panel) nó không áp dụng style nào; bỏ đi không đổi hiển thị. */}
            <label className="field">
              <input
                type="checkbox"
                data-testid="export-stab-single-thread-toggle"
                checked={stabSingleThread}
                onChange={(e) => {
                  setStabSingleThread(e.target.checked);
                  saveStabSingleThread(e.target.checked);
                }}
                disabled={renderStatus === "uploading" || renderStatus === "rendering"}
              />
              <span>{stabStrings.label}</span>
            </label>
          </div>
          {stabStrings.hint && (
            <p className="tips preset-desc">{stabStrings.hint}</p>
          )}

          {/* --- Đợt 65 S4: Encoder GPU — trạng thái probe + nút probe lại.
              Trạng thái lấy từ cache đĩa probe (bridge GET /api/gpu-probe);
              nút bấm xoá cache cũ (kể cả cache lỗi do tháo GPU trong TTL)
              rồi probe lại thật (POST /api/gpu-probe/reprobe). Nếu encoder
              GPU lỗi lúc render, worker tự thử lại bằng libx264 (xem
              server/render/src/render.js bước 7) nên nút này chỉ để kiểm
              tra/chủ động làm mới, không bắt buộc trước mỗi lần render. */}
          <div className="gpu-probe">
            <div className="preset-row">
              <label>{gpuStrings.title}</label>
              <span className="tips">{gpuProbeStatusText(gpuStatus, lang)}</span>
              <button
                onClick={() => void reprobeGpu()}
                disabled={gpuProbing || renderStatus === "uploading" || renderStatus === "rendering"}
                title={gpuStrings.fallbackNote}
              >
                {gpuProbing ? gpuStrings.probing : gpuStrings.reprobe}
              </button>
            </div>
            {gpuMsg && <p className="tips preset-desc">{gpuMsg}</p>}
            <p className="tips preset-desc">{gpuStrings.fallbackNote}</p>
          </div>

          {/* --- R1-083/R1-085: Auto-reframe 9:16 --- */}
          <ReframeSection media={media} bridgeUrl={BRIDGE_URL} />

          {renderStatus === "idle" && (
            <p className="tips">
              {codeToken(t("exportPanel.renderIntro", { url: BRIDGE_URL }), BRIDGE_URL)}
            </p>
          )}
          {(renderStatus === "uploading" || renderStatus === "rendering") && (
            <div className="render-progress" data-job-id={jobId ?? undefined}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.round(renderProgress * 100)}%` }} />
              </div>
              <div className="progress-label">
                {renderStatus === "uploading" ? t("exportPanel.uploading") :
                  queuePos != null && renderProgress <= 0
                    ? t("exportPanel.queued", { pos: String(queuePos) }) // R1-065
                    : t("exportPanel.rendering", { pct: String(Math.round(renderProgress * 100)) }) +
                      (renderEta != null && renderProgress > 0
                        ? t("exportPanel.renderEta", { eta: fmtEta(renderEta) }) // R1-065
                        : "")}
              </div>
              {/* Đợt 66 T8 — job được nối lại khi mở lại panel: báo rõ để
                  user biết tiến trình không phải bắt đầu lại. */}
              {resumedJob && resumeStrings.resumedJob && (
                <p className="tips">{resumeStrings.resumedJob}</p>
              )}
              {/* Đợt 67 U7 — mở lại panel giữa lúc upload đang bay: báo rõ
                  panel đang chờ job xuất hiện trên bridge (không POST
                  lại, không mất tiến trình). */}
              {uploadWaiting && historyStrings.uploadWaiting && (
                <p className="tips">{historyStrings.uploadWaiting}</p>
              )}
              {/* Đợt 64 R8 — ghi chú của job (vd "Phục hồi sau khi server
                  restart — render lại từ đầu."): chỉ hiện khi job CÓ note;
                  job thường không có note thì khối này không render gì. */}
              {renderNote && (
                <div className="render-note" role="note">{renderNote}</div>
              )}
              <button onClick={cancelRender}>{t("bgremove.cancel")}</button>
            </div>
          )}
          {renderStatus === "done" && (
            <div
              className="valid-banner ok"
              data-download-state={downloadChecking ? "checking" : downloadAvailable === false ? "missing" : downloadAvailable === true ? "available" : "unknown"}
            >
              ✅ Render xong!{" "}
              {downloadChecking ? (
                // Đợt 68 V8 — đang HEAD kiểm tra output: chưa hiện nút tải
                // (tránh anchor nhận JSON lỗi khi file đã mất).
                <span className="tips">{exportDestStringsForLang.checking}</span>
              ) : downloadAvailable === false ? (
                // Đợt 68 V8 — file output đã mất: KHÔNG hiện nút tải nữa,
                // báo rõ + cho xoá khỏi lịch sử (nút chia sẻ cũng cần
                // file nên ẩn cùng).
                <>
                  <span>{exportDestStringsForLang.missing}</span>{" "}
                  <button onClick={deleteMissingDownload}>
                    {exportDestStringsForLang.deleteFromHistory}
                  </button>
                </>
              ) : (
                <>
                  <button className="primary" onClick={downloadMp4}>{t("exportPanel.downloadMp4")}</button>{" "}
                  <button onClick={() => void doExportSharePage()} disabled={shareStatus === "working"}>
                    {t("exportPanel.exportShare")}
                  </button>
                </>
              )}
              {/* Đợt 68 V8 — Electron: cho thấy đích đã chọn/khôi phục để
                  user biết MP4 sẽ ghi ra đâu (không phải tải trình duyệt). */}
              {downloadAvailable !== false && isNativeDesktop() && exportDest && exportDestStringsForLang.savedTo && (
                <span className="tips" data-export-dest={exportDest}>
                  {exportDestStringsForLang.savedTo.replace("{path}", exportDest)}
                </span>
              )}
              {shareMsg && (
                <div className={shareStatus === "error" ? "valid-banner bad" : "tips"}>{shareMsg}</div>
              )}
            </div>
          )}
          {/* Đợt 27 K2 — cảnh báo curve tốc độ vi phạm (từ warnings J5):
              chặn export chỉ khi render-fatal (curveBlocker); chỉ lệch
              đơn điệu thì vẫn xuất được nhưng vẫn hiện để user sửa. */}
          {curveWarnings.length > 0 && (
            <div className={curveBlocker !== null ? "valid-banner bad" : "tips"}>
              ⚠️ {t("exportPanel.curveWarningsTitle", { count: String(curveWarnings.length) })}
              <ul>
                {curveWarnings.slice(0, 5).map((w, i) => (
                  <li key={i}>{formatWarningTranslated(w, i18nLookup)}</li>
                ))}
                {curveWarnings.length > 5 && <li>{t("exportPanel.curveWarningsMore", { count: String(curveWarnings.length - 5) })}</li>}
              </ul>
              {curveBlocker !== null && <p>{t("exportPanel.curveBlockerNote")}</p>}
              <button onClick={fixCurves}>🔧 {t("exportPanel.fixCurves")}</button>
              {curveFixMsg && <p>{curveFixMsg}</p>}
            </div>
          )}
          {renderStatus === "error" && renderError && (
            <div className="valid-banner bad">❌ {renderError}</div>
          )}
          {/* Đợt 66 T8 — job lỗi/gián đoạn được nối lại khi mở lại panel:
              hiện note phục hồi (nếu có) để user biết vì sao lỗi, nhãn
              resume, và nút chạy lại. Nút "Render lại" hiện cho mọi lỗi
              có jobId (cả lỗi vừa render xong — endpoint retry của bridge
              nhận mọi job error/interrupted). */}
          {renderStatus === "error" && renderNote && (
            <div className="render-note" role="note">{renderNote}</div>
          )}
          {renderStatus === "error" && resumedJob && resumeStrings.resumedJob && (
            <p className="tips">{resumeStrings.resumedJob}</p>
          )}
          {renderStatus === "error" && jobId && resumeStrings.retryRender && (
            <button onClick={retryRender} disabled={retrying}>
              {resumeStrings.retryRender}
            </button>
          )}
          {/* Đợt 29 L3 — chi tiết lỗi đã redact (chỉ khi bridge trả về):
              mã + summary + tối đa 5 dòng lỗi; không bao giờ in đường
              dẫn tuyệt đối/token (bridge đã redact, xem LIMITS). */}
          {renderStatus === "error" && renderErrorDetail && (
            <div className="tips">
              <div>
                <b>{t("exportPanel.errorDetailTitle", { code: renderErrorDetail.code })}</b> {localizedErrorSummary(renderErrorDetail, t)}
              </div>
              {/* Đợt 63 R5: có validationDetails thì hiển thị từng dòng
                  validator ĐÃ DỊCH (tối đa 5, như details cũ); không có
                  thì giữ details thô như trước — payload bridge cũ. */}
              {validationLines.length > 0 ? (
                <>
                  <ul>
                    {validationLines.slice(0, 5).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                  {(renderErrorDetail.validationDetailsOmitted ?? 0) + Math.max(0, validationLines.length - 5) > 0 && (
                    <p>{t("exportPanel.errorDetailMore", { count: String((renderErrorDetail.validationDetailsOmitted ?? 0) + Math.max(0, validationLines.length - 5)) })}</p>
                  )}
                </>
              ) : (
                <>
                  {renderErrorDetail.details.length > 0 && (
                    <ul>
                      {renderErrorDetail.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                  {renderErrorDetail.detailsOmitted > 0 && (
                    <p>{t("exportPanel.errorDetailMore", { count: String(renderErrorDetail.detailsOmitted) })}</p>
                  )}
                  {renderErrorDetail.details.length === 0 && renderErrorDetail.redactedTail && (
                    <pre>{renderErrorDetail.redactedTail}</pre>
                  )}
                </>
              )}
            </div>
          )}
          {renderStatus === "cancelled" && (
            <div className="tips">{t("exportPanel.renderCancelled")}</div>
          )}
          {(renderStatus === "idle" || renderStatus === "error" || renderStatus === "cancelled" || renderStatus === "done") && (
            <button
              className="primary"
              onClick={startRender}
              disabled={!ok || !presetOk}
              title={!presetOk ? t("exportPanel.presetInvalid") : t("exportPanel.exportMp4")}
            >
              {t("exportPanel.exportMp4Size", {
                w: String(activePreset.width),
                h: String(activePreset.height),
              })}
            </button>
          )}

          {/* --- Đợt 67 U7: Lịch sử xuất (persist localStorage) — job done
              mở lại không còn về idle mù (nợ T8 §5.1): bấm "Xem kết quả"
              để hiện lại banner tải MP4, job đang chạy thì "Theo dõi
              tiếp", job lỗi/gián đoạn thì "Render lại", mục nào cũng xoá
              được. Mục lỗi upload (chưa có job) chỉ xoá được, không mở. */}
          <div className="job-history" data-history-count={jobHistory.length}>
            <div className="panel-head">{historyStrings.title}</div>
            {jobHistory.length === 0 ? (
              <p className="tips">{historyStrings.empty}</p>
            ) : (
              <ul className="job-history-list">
                {jobHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="job-history-row"
                    data-job-id={entry.jobId ?? undefined}
                    data-status={entry.status}
                  >
                    <span className="job-history-status" data-status={entry.status}>
                      {historyStatusLabel(entry, lang)}
                    </span>
                    <span className="job-history-meta">
                      {entry.projectName || entry.outputName || entry.id}
                      {entry.outputSize ? ` · ${formatBytes(entry.outputSize)}` : ""}
                      {` · ${new Date(entry.createdAt).toLocaleTimeString()}`}
                    </span>
                    {entry.error && (
                      <span className="job-history-error" title={entry.error}>
                        {entry.error}
                      </span>
                    )}
                    {entry.status === "done" && entry.jobId && (
                      <button onClick={() => void openHistoryEntry(entry)}>
                        {historyStrings.openResult}
                      </button>
                    )}
                    {(entry.status === "running" || entry.status === "queued") && entry.jobId && (
                      <button onClick={() => void openHistoryEntry(entry)}>
                        {historyStrings.resume}
                      </button>
                    )}
                    {(entry.status === "error" || entry.status === "interrupted") && entry.jobId && (
                      <button onClick={() => void retryHistoryJob(entry)} disabled={retrying}>
                        {resumeStrings.retryRender}
                      </button>
                    )}
                    <button onClick={() => deleteHistoryJob(entry)}>
                      {historyStrings.delete}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <pre className="json-preview">{json}</pre>

        <p className="tips">{t("exportPanel.jsonNote")}</p>

        <div className="modal-actions">
          <button onClick={copy}>{copied ? t("exportPanel.copied") : t("exportPanel.copyJson")}</button>
          <button className="primary" onClick={download} disabled={!ok}>
            {t("exportPanel.downloadJson")}
          </button>
        </div>
      </div>
    </div>
  );
}
